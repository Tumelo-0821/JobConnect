from fastapi import APIRouter, Depends, status

from app.dependencies import get_current_employer, get_job_repository
from app.repositories.memory import JobRepository
from app.schemas.auth import MessageResponse
from app.schemas.job import JobCreateRequest, JobResponse, JobUpdateRequest
from app.services.job_service import JobService

router = APIRouter(prefix="/employers/jobs", tags=["Jobs"])


def get_job_service(job_repo: JobRepository = Depends(get_job_repository)) -> JobService:
    return JobService(job_repo)


@router.post(
    "",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new job posting",
)
def create_job(
    payload: JobCreateRequest,
    employer: dict = Depends(get_current_employer),
    job_service: JobService = Depends(get_job_service),
) -> JobResponse:
    return job_service.create_job(employer["id"], payload)


@router.get(
    "",
    response_model=list[JobResponse],
    summary="List jobs for the authenticated employer",
)
def list_jobs(
    employer: dict = Depends(get_current_employer),
    job_service: JobService = Depends(get_job_service),
) -> list[JobResponse]:
    return job_service.list_jobs(employer["id"])


@router.get(
    "/{job_id}",
    response_model=JobResponse,
    summary="Get a single job owned by the employer",
)
def get_job(
    job_id: str,
    employer: dict = Depends(get_current_employer),
    job_service: JobService = Depends(get_job_service),
) -> JobResponse:
    return job_service.get_job(employer["id"], job_id)


@router.patch(
    "/{job_id}",
    response_model=JobResponse,
    summary="Update a job owned by the employer",
)
def update_job(
    job_id: str,
    payload: JobUpdateRequest,
    employer: dict = Depends(get_current_employer),
    job_service: JobService = Depends(get_job_service),
) -> JobResponse:
    return job_service.update_job(employer["id"], job_id, payload)


@router.delete(
    "/{job_id}",
    response_model=MessageResponse,
    summary="Delete a job owned by the employer",
)
def delete_job(
    job_id: str,
    employer: dict = Depends(get_current_employer),
    job_service: JobService = Depends(get_job_service),
) -> MessageResponse:
    job_service.delete_job(employer["id"], job_id)
    return MessageResponse(message="Job deleted successfully")


@router.post(
    "/{job_id}/close",
    response_model=JobResponse,
    summary="Close/deactivate a job owned by the employer",
)
def close_job(
    job_id: str,
    employer: dict = Depends(get_current_employer),
    job_service: JobService = Depends(get_job_service),
) -> JobResponse:
    return job_service.close_job(employer["id"], job_id)
