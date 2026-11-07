from fastapi import APIRouter, Depends, status

from app.dependencies import get_application_repository, get_current_employer, get_job_repository, get_user_repository
from app.repositories.memory import ApplicationRepository, JobRepository, UserRepository
from app.services.application_service import ApplicationService

router = APIRouter(prefix="/employers", tags=["Employers"])


def get_application_service(
    app_repo: ApplicationRepository = Depends(get_application_repository),
    job_repo: JobRepository = Depends(get_job_repository),
    user_repo: UserRepository = Depends(get_user_repository),
) -> ApplicationService:
    return ApplicationService(app_repo, job_repo, user_repo)


@router.get(
    "/stats/applications",
    summary="Get total application count for employer",
)
def get_application_stats(
    employer: dict = Depends(get_current_employer),
    app_service: ApplicationService = Depends(get_application_service),
) -> dict[str, int]:
    return {"total": app_service.count_employer_applications(employer["id"])}
