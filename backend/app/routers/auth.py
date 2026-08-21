from fastapi import APIRouter, Depends, status

from app.dependencies import get_current_user, get_user_repository, user_to_public
from app.repositories.memory import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserPublic
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_auth_service(user_repo: UserRepository = Depends(get_user_repository)) -> AuthService:
    return AuthService(user_repo)


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new account (employer or worker)",
)
def register(
    payload: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    return auth_service.register(payload)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login",
)
def login(
    payload: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    return auth_service.login(payload)


@router.get(
    "/me",
    response_model=UserPublic,
    summary="Get the current authenticated user",
)
def get_me(current_user: dict = Depends(get_current_user)) -> UserPublic:
    return UserPublic(**user_to_public(current_user))


@router.post(
    "/verify",
    response_model=UserPublic,
    summary="Mark the current user as verified",
)
def verify_account(
    current_user: dict = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
) -> UserPublic:
    return auth_service.verify_user(current_user["id"])
