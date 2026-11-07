
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status

from app.models import JobDocument, JobStatus
from app.repositories.memory import JobRepository, UserRepository
from app.repositories.notification_repository import NotificationRepository
from app.schemas.auth import JobUrgency
from app.schemas.job import JobCreateRequest, JobResponse, JobUpdateRequest
from app.schemas.notification import NotificationType
from app.services.notification_service import NotificationService


def normalize_datetime(value: datetime) -> datetime:
    """Treat older naive datetimes as UTC."""
    if value.tzinfo is None or value.utcoffset() is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


def is_job_expired(closing_date: datetime | None) -> bool:
    """Return True when a job's closing deadline has passed."""
    if closing_date is None:
        return False

    closing_date = normalize_datetime(closing_date)
    return closing_date <= datetime.now(timezone.utc)


def calculate_urgency(closing_date: datetime) -> JobUrgency:
    """Calculate urgency using the time remaining until the deadline."""
    closing_date = normalize_datetime(closing_date)
    remaining = closing_date - datetime.now(timezone.utc)

    if remaining <= timedelta(days=0):
        return JobUrgency.URGENT
    if remaining <= timedelta(days=7.5):
        return JobUrgency.URGENT
    if remaining <= timedelta(days=30):
        return JobUrgency.SOON

    return JobUrgency.NORMAL


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

    def _refresh_job(
        self,
        job_id: str,
        job_data: dict,
    ) -> dict:
        """Close expired jobs and refresh their calculated urgency."""
        updates = {}
        closing_date = job_data.get("closing_date")
        current_status = job_data.get("status")

        if (
            current_status == JobStatus.OPEN.value
            and is_job_expired(closing_date)
        ):
            updates["status"] = JobStatus.CLOSED.value

        if closing_date is not None:
            calculated_urgency = calculate_urgency(closing_date).value
            if job_data.get("urgency") != calculated_urgency:
                updates["urgency"] = calculated_urgency

        if updates:
            return self.job_repo.update(job_id, updates)

        return job_data

    def create_job(
        self,
        employer_id: str,
        payload: JobCreateRequest,
    ) -> JobResponse:
        if is_job_expired(payload.closing_date):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="The closing date must be in the future.",
            )

        job_data = JobDocument.create(
            employer_id=employer_id,
            title=payload.title,
            category=payload.category,
            description=payload.description,
            budget=payload.budget,
            location=payload.location,
            province=payload.province,
            duration=payload.duration,
            urgency=calculate_urgency(payload.closing_date),
            required_skills=payload.required_skills,
            employment_type=payload.employment_type,
            closing_date=payload.closing_date,
        )
        job_id, created = self.job_repo.create(job_data)

        # Notify verified workers whose skills match the job.
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

                if not required_skills.intersection(worker_skills):
                    continue

                self.notification_service.create_notification(
                    recipient_id=worker_id,
                    notification_type=NotificationType.JOB_MATCH,
                    title="New job matching your skills",
                    message=(
                        f"A new job '{payload.title}' has been posted "
                        "and matches your skills."
                    ),
                    related_job_id=job_id,
                )

        return JobResponse(**JobDocument.to_response(job_id, created))

    def list_jobs(self, employer_id: str) -> list[JobResponse]:
        jobs = self.job_repo.list_by_employer(employer_id)
        responses = []

        for job_id, data in jobs:
            refreshed = self._refresh_job(job_id, data)
            responses.append(
                JobResponse(**JobDocument.to_response(job_id, refreshed))
            )

        return responses

    def get_job(self, employer_id: str, job_id: str) -> JobResponse:
        job_doc_id, job_data = self._get_owned_job(employer_id, job_id)
        job_data = self._refresh_job(job_doc_id, job_data)

        return JobResponse(**JobDocument.to_response(job_doc_id, job_data))

    def update_job(
        self,
        employer_id: str,
        job_id: str,
        payload: JobUpdateRequest,
    ) -> JobResponse:
        job_doc_id, job_data = self._get_owned_job(employer_id, job_id)
        updates = payload.model_dump(exclude_unset=True)

        if not updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields provided for update",
            )

        # Urgency is calculated from the deadline, never supplied manually.
        updates.pop("urgency", None)

        closing_date = updates.get(
            "closing_date",
            job_data.get("closing_date"),
        )

        if closing_date is not None:
            if is_job_expired(closing_date):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="The closing date must be in the future.",
                )

            updates["urgency"] = calculate_urgency(closing_date).value

        if "status" in updates and updates["status"] is not None:
            requested_status = updates["status"]
            if isinstance(requested_status, JobStatus):
                requested_status = requested_status.value

            # Do not allow an expired job to be reopened.
            if (
                requested_status == JobStatus.OPEN.value
                and is_job_expired(closing_date)
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An expired job cannot be reopened.",
                )

            updates["status"] = requested_status

        updated = self.job_repo.update(job_doc_id, updates)
        updated = self._refresh_job(job_doc_id, updated)

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
        jobs = self.job_repo.list_open_jobs(
            category=category,
            province=province,
        )
        responses = []

        for job_id, data in jobs:
            refreshed = self._refresh_job(job_id, data)

            # Do not show jobs that have expired or were closed.
            if refreshed.get("status") != JobStatus.OPEN.value:
                continue

            responses.append(
                JobResponse(**JobDocument.to_response(job_id, refreshed))
            )

        return responses

    def get_open_job(self, job_id: str) -> JobResponse:
        result = self.job_repo.get_by_id(job_id)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )

        job_doc_id, job_data = result
        job_data = self._refresh_job(job_doc_id, job_data)

        if job_data.get("status") != JobStatus.OPEN.value:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )

        return JobResponse(**JobDocument.to_response(job_doc_id, job_data))

    def _get_owned_job(
        self,
        employer_id: str,
        job_id: str,
    ) -> tuple[str, dict]:
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
