from fastapi import APIRouter, Depends, Query

from app.repositories.memory import JobRepository, UserRepository
from app.repositories.notification_repository import NotificationRepository
from app.routers.jobs import get_job_service
from app.services.job_service import JobService
from app.schemas.job import JobResponse

router = APIRouter(prefix="/jobs", tags=["Public Jobs"])


@router.get("", response_model=list[JobResponse])
def list_public_jobs(
    category: str | None = Query(default=None),
    province: str | None = Query(default=None),
    job_service: JobService = Depends(get_job_service),
) -> list[JobResponse]:
    return job_service.list_open_jobs(
        category=category,
        province=province,
    )


@router.get("/{job_id}", response_model=JobResponse)
def get_public_job(
    job_id: str,
    job_service: JobService = Depends(get_job_service),
) -> JobResponse:
    return job_service.get_open_job(job_id)