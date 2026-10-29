from fastapi import APIRouter, Depends

from app.dependencies import get_current_employer, get_user_repository
from app.repositories.memory import UserRepository
from app.schemas.auth import EmployerProfileUpdate, UserPublic
from app.services.employer_service import EmployerService

router = APIRouter(prefix="/employers", tags=["Employers"])


def get_employer_service(
    user_repo: UserRepository = Depends(get_user_repository),
) -> EmployerService:
    return EmployerService(user_repo)


@router.get(
    "/me",
    response_model=UserPublic,
    summary="Get employer profile",
)
def get_employer_profile(
    employer: dict = Depends(get_current_employer),
    employer_service: EmployerService = Depends(get_employer_service),
) -> UserPublic:
    return employer_service.get_profile(employer)


@router.patch(
    "/me",
    response_model=UserPublic,
    summary="Update employer profile",
)
def update_employer_profile(
    payload: EmployerProfileUpdate,
    employer: dict = Depends(get_current_employer),
    employer_service: EmployerService = Depends(get_employer_service),
) -> UserPublic:
    return employer_service.update_profile(employer, payload)
