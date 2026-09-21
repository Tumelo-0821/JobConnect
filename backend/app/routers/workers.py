from fastapi import APIRouter, Depends, Query

from app.dependencies import (
    get_application_repository,
    get_current_worker,
    get_job_repository,
    get_user_repository,
    get_notification_repository
)
from app.repositories.memory import ApplicationRepository, JobRepository, UserRepository
from app.schemas.application import ApplicationResponse
from app.schemas.auth import UserPublic, WorkerListing, WorkerProfileUpdate
from app.services.application_service import ApplicationService
from app.services.worker_service import WorkerService

router = APIRouter(prefix="/workers", tags=["Workers"])


def get_worker_service(user_repo: UserRepository = Depends(get_user_repository)) -> WorkerService:
    return WorkerService(user_repo)


def get_application_service(
    app_repo: ApplicationRepository = Depends(get_application_repository),
    job_repo: JobRepository = Depends(get_job_repository),
    user_repo: UserRepository = Depends(get_user_repository),
) -> ApplicationService:
    return ApplicationService(
    app_repo,
    job_repo,
    user_repo,
    get_notification_repository(),
)


@router.get(
    "",
    response_model=list[WorkerListing],
    summary="Search and list workers",
)
def list_workers(
    search: str | None = Query(default=None),
    skill: str | None = Query(default=None),
    worker_service: WorkerService = Depends(get_worker_service),
) -> list[WorkerListing]:
    return worker_service.list_workers(search=search, skill=skill)


@router.get(
    "/me/profile",
    response_model=UserPublic,
    summary="Get worker profile",
)
def get_worker_profile(
    worker: dict = Depends(get_current_worker),
    worker_service: WorkerService = Depends(get_worker_service),
) -> UserPublic:
    return worker_service.get_profile(worker)


@router.patch(
    "/me/profile",
    response_model=UserPublic,
    summary="Update worker profile",
)
def update_worker_profile(
    payload: WorkerProfileUpdate,
    worker: dict = Depends(get_current_worker),
    worker_service: WorkerService = Depends(get_worker_service),
) -> UserPublic:
    return worker_service.update_profile(worker, payload)


@router.get(
    "/me/applications",
    response_model=list[ApplicationResponse],
    summary="List the worker's job applications",
)
def list_my_applications(
    worker: dict = Depends(get_current_worker),
    app_service: ApplicationService = Depends(get_application_service),
) -> list[ApplicationResponse]:
    return app_service.list_worker_applications(worker["id"])


@router.get(
    "/{worker_id}",
    response_model=WorkerListing,
    summary="Get a worker's public profile",
)
def get_worker(
    worker_id: str,
    worker_service: WorkerService = Depends(get_worker_service),
) -> WorkerListing:
    return worker_service.get_worker(worker_id)
