from fastapi import HTTPException, status

from app.models import JobDocument, JobStatus
from app.repositories.memory import JobRepository
from app.schemas.auth import JobUrgency
from app.schemas.job import JobCreateRequest, JobResponse, JobUpdateRequest


class JobService:
    def __init__(self, job_repo: JobRepository) -> None:
        self.job_repo = job_repo

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
