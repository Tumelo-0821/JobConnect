from fastapi import APIRouter, Depends, Query, status

from app.dependencies import get_application_repository, get_current_worker, get_job_repository, get_user_repository
from app.repositories.memory import ApplicationRepository, JobRepository, UserRepository
from app.schemas.application import ApplicationResponse
from app.schemas.job import JobResponse
from app.services.application_service import ApplicationService
from app.services.job_service import JobService

router = APIRouter(prefix="/jobs", tags=["Jobs"])


def get_job_service(job_repo: JobRepository = Depends(get_job_repository)) -> JobService:
    return JobService(job_repo)


def get_application_service(
    app_repo: ApplicationRepository = Depends(get_application_repository),
    job_repo: JobRepository = Depends(get_job_repository),
    user_repo: UserRepository = Depends(get_user_repository),
) -> ApplicationService:
    return ApplicationService(app_repo, job_repo, user_repo)


@router.get(
    "",
    response_model=list[JobResponse],
    summary="Browse open jobs",
)
def browse_jobs(
    category: str | None = Query(default=None),
    province: str | None = Query(default=None),
    job_service: JobService = Depends(get_job_service),
) -> list[JobResponse]:
    return job_service.list_open_jobs(category=category, province=province)


@router.get(
    "/{job_id}",
    response_model=JobResponse,
    summary="Get an open job by ID",
)
def get_job(
    job_id: str,
    job_service: JobService = Depends(get_job_service),
) -> JobResponse:
    return job_service.get_open_job(job_id)


@router.post(
    "/{job_id}/apply",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Apply for a job",
)
def apply_for_job(
    job_id: str,
    worker: dict = Depends(get_current_worker),
    app_service: ApplicationService = Depends(get_application_service),
) -> ApplicationResponse:
    return app_service.apply(worker, job_id)
