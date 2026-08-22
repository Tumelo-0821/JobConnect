from fastapi import HTTPException, status

from app.models import JobDocument, JobStatus
from app.repositories.memory import JobRepository, UserRepository
from app.repositories.notification_repository import NotificationRepository
from app.schemas.auth import JobUrgency
from app.schemas.job import JobCreateRequest, JobResponse, JobUpdateRequest
from app.schemas.notification import NotificationType
from app.services.notification_service import NotificationService


class JobService:
    def __init__(
        self,
        job_repo: JobRepository,
        user_repo: UserRepository,
        notification_repo: NotificationRepository,
    ) -> None:
        self.job_repo = job_repo
        self.user_repo = user_repo
        self.notification_service = NotificationService(notification_repo)

    def create_job(self, employer_id: str, payload: JobCreateRequest) -> JobResponse:
        job_data = JobDocument.create(
            employer_id=employer_id,
            title=payload.title,
            category=payload.category,
            description=payload.description,
            budget=payload.budget,
            location=payload.location,
            province=payload.province,
            duration=payload.duration,
            urgency=payload.urgency,
            required_skills=payload.required_skills,
            employment_type=payload.employment_type,
            closing_date=payload.closing_date,
        )
        job_id, created = self.job_repo.create(job_data)

        # Notify verified workers whose skills match the job
        required_skills = {
            skill.strip().lower()
            for skill in payload.required_skills
            if skill and skill.strip()
        }

        if required_skills:
            workers = self.user_repo.list_workers()

            for worker_id, worker_data in workers:
                if not worker_data.get("is_verified"):
                    continue

                worker_skills = {
                    str(skill).strip().lower()
                    for skill in worker_data.get("skills", [])
                    if skill
                }

                matching_skills = required_skills.intersection(worker_skills)

                if not matching_skills:
                    continue

                self.notification_service.create_notification(
                    recipient_id=worker_id,
                    notification_type=NotificationType.JOB_MATCH,
                    title="New job matching your skills",
                    message=(
                        f"A new job '{payload.title}' has been posted "
                        f"and matches your skills."
                    ),
                    related_job_id=job_id,
                )

        return JobResponse(**JobDocument.to_response(job_id, created))

    def list_jobs(self, employer_id: str) -> list[JobResponse]:
        jobs = self.job_repo.list_by_employer(employer_id)
        return [JobResponse(**JobDocument.to_response(job_id, data)) for job_id, data in jobs]

    def get_job(self, employer_id: str, job_id: str) -> JobResponse:
        job = self._get_owned_job(employer_id, job_id)
        job_doc_id, job_data = job
        return JobResponse(**JobDocument.to_response(job_doc_id, job_data))

    def update_job(
        self,
        employer_id: str,
        job_id: str,
        payload: JobUpdateRequest,
    ) -> JobResponse:
        job_doc_id, job_data = self._get_owned_job(employer_id, job_id)
        updates = payload.model_dump(exclude_unset=True)

        if "urgency" in updates and updates["urgency"] is not None:
            updates["urgency"] = updates["urgency"].value
        if "status" in updates and updates["status"] is not None:
            updates["status"] = updates["status"].value

        if not updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields provided for update",
            )

        updated = self.job_repo.update(job_doc_id, updates)
        return JobResponse(**JobDocument.to_response(job_doc_id, updated))

    def delete_job(self, employer_id: str, job_id: str) -> None:
        job_doc_id, _ = self._get_owned_job(employer_id, job_id)
        self.job_repo.delete(job_doc_id)

    def close_job(self, employer_id: str, job_id: str) -> JobResponse:
        job_doc_id, _ = self._get_owned_job(employer_id, job_id)
        updated = self.job_repo.update(
            job_doc_id,
            {"status": JobStatus.CLOSED.value},
        )
        return JobResponse(**JobDocument.to_response(job_doc_id, updated))

    def list_open_jobs(
        self,
        *,
        category: str | None = None,
        province: str | None = None,
    ) -> list[JobResponse]:
        jobs = self.job_repo.list_open_jobs(category=category, province=province)
        return [JobResponse(**JobDocument.to_response(job_id, data)) for job_id, data in jobs]

    def get_open_job(self, job_id: str) -> JobResponse:
        result = self.job_repo.get_by_id(job_id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )

        job_doc_id, job_data = result
        if job_data.get("status") != JobStatus.OPEN.value:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )

        return JobResponse(**JobDocument.to_response(job_doc_id, job_data))

    def _get_owned_job(self, employer_id: str, job_id: str) -> tuple[str, dict]:
        result = self.job_repo.get_by_id(job_id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )

        job_doc_id, job_data = result
        if job_data.get("employer_id") != employer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this job",
            )
        return job_doc_id, job_data
