from pathlib import Path
import mimetypes

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse

from app.dependencies import (
    get_current_employer,
    get_application_repository,
    get_job_repository,
    get_user_repository,
    get_notification_repository,
)
from app.repositories.memory import ApplicationRepository, JobRepository, UserRepository
from app.schemas.application import ApplicationResponse, ApplicationStatusUpdate
from app.services.application_service import ApplicationService
from app.repositories.notification_repository import NotificationRepository

BASE_DIR = Path(__file__).resolve().parents[2]
CV_UPLOAD_DIR = BASE_DIR / "uploads" / "cvs"

#router = APIRouter(prefix="/employers/jobs", tags=["Applications"])
router = APIRouter(prefix="/employers", tags=["Applications"])

def get_application_service(
    app_repo: ApplicationRepository = Depends(get_application_repository),
    job_repo: JobRepository = Depends(get_job_repository),
    user_repo: UserRepository = Depends(get_user_repository),
    notification_repo: NotificationRepository = Depends(
        get_notification_repository
    ),
) -> ApplicationService:
    return ApplicationService(
        app_repo,
        job_repo,
        user_repo,
        notification_repo,
    )

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

@router.get(
    "/jobs/{job_id}/applications/{app_id}/cv",
    summary="View an applicant CV",
)
def view_application_cv(
    job_id: str,
    app_id: str,
    employer: dict = Depends(get_current_employer),
    app_service: ApplicationService = Depends(get_application_service),
):
    cv_info = app_service.get_application_cv(
        employer["id"],
        job_id,
        app_id,
    )

    file_path = (
        BASE_DIR / cv_info["cv_storage_path"]
    ).resolve()

    # Make sure the file stays inside the CV upload directory.
    try:
        file_path.relative_to(CV_UPLOAD_DIR.resolve())
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid CV file path",
        ) from exc

    if not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV file not found",
        )

    media_type, _ = mimetypes.guess_type(
        str(file_path)
    )

    return FileResponse(
        path=file_path,
        media_type=media_type or "application/octet-stream",
        filename=cv_info["cv_file_name"],
    )
