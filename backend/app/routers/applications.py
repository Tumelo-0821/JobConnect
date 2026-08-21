from fastapi import APIRouter, Depends

from app.dependencies import get_current_employer, get_application_repository, get_job_repository, get_user_repository
from app.repositories.memory import ApplicationRepository, JobRepository, UserRepository
from app.schemas.application import ApplicationResponse, ApplicationStatusUpdate
from app.services.application_service import ApplicationService

#router = APIRouter(prefix="/employers/jobs", tags=["Applications"])
router = APIRouter(prefix="/employers", tags=["Applications"])

def get_application_service(
    app_repo: ApplicationRepository = Depends(get_application_repository),
    job_repo: JobRepository = Depends(get_job_repository),
    user_repo: UserRepository = Depends(get_user_repository),
) -> ApplicationService:
    return ApplicationService(app_repo, job_repo, user_repo)

@router.get(
    "/all-applications",
    response_model=list[ApplicationResponse],
    summary="List applications for the employer",
)

def list_employer_applications(
    employer: dict = Depends(get_current_employer),
    app_service: ApplicationService = Depends(get_application_service),
) -> list[ApplicationResponse]:
    return app_service.list_employer_applications(employer["id"])

@router.get(
    "/jobs/{job_id}/applications",
    response_model=list[ApplicationResponse],
    summary="List applications for a job",
)
def list_job_applications(
    job_id: str,
    employer: dict = Depends(get_current_employer),
    app_service: ApplicationService = Depends(get_application_service),
) -> list[ApplicationResponse]:
    return app_service.list_job_applications(employer["id"], job_id)



@router.patch(
    "/jobs/{job_id}/applications/{app_id}",
    response_model=ApplicationResponse,
    summary="Update application status",
)
def update_application_status(
    job_id: str,
    app_id: str,
    payload: ApplicationStatusUpdate,
    employer: dict = Depends(get_current_employer),
    app_service: ApplicationService = Depends(get_application_service),
) -> ApplicationResponse:
    return app_service.update_application_status(employer["id"], job_id, app_id, payload)
