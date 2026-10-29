
from fastapi import APIRouter, Depends, status

from app.dependencies import get_current_user, get_user_repository, user_to_public
from app.repositories.memory import UserRepository
from app.repositories.otp_repository import OTPRepository
from app.schemas.auth import (
    LoginRequest,
    OTPRegisterRequest,
    OTPResendRequest,
    OTPVerifyRequest,
    TokenResponse,
    UserPublic,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_auth_service(
    user_repo: UserRepository = Depends(get_user_repository),
) -> AuthService:
    return AuthService(user_repo, otp_repo=OTPRepository())


@router.post(
    "/register",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Start registration and send an OTP",
)
def register(
    payload: OTPRegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> dict:
    return auth_service.start_otp_registration(payload)


@router.post(
    "/register/otp/verify",
    response_model=TokenResponse,
    summary="Verify registration OTP and create the account",
)
def verify_registration_otp(
    payload: OTPVerifyRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    return auth_service.verify_otp_registration(payload)


@router.post(
    "/register/otp/resend",
    summary="Resend registration OTP",
)
def resend_registration_otp(
    payload: OTPResendRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> dict:
    return auth_service.resend_otp(payload.challenge_id)


@router.post("/login", response_model=TokenResponse, summary="Login")
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
    summary="Mark identity verification as complete",
)
def verify_account(
    current_user: dict = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
) -> UserPublic:
    return auth_service.verify_user(current_user["id"])
