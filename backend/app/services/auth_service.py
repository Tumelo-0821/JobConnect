from fastapi import HTTPException, status

from app.config import settings
from app.models import UserDocument, UserRole
from app.repositories.memory import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserPublic
from app.security import create_access_token, hash_password, verify_password


class AuthService:
    def __init__(self, user_repo: UserRepository) -> None:
        self.user_repo = user_repo

    def register(self, payload: RegisterRequest) -> TokenResponse:
        existing = self.user_repo.get_by_email(payload.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists",
            )

        common_kwargs = {
            "email": str(payload.email),
            "password_hash": hash_password(payload.password),
            "first_name": payload.first_name,
            "last_name": payload.last_name,
            "phone": payload.phone,
            "province": payload.province,
        }

        if payload.role == UserRole.EMPLOYER:
            user_id, user_data = self.user_repo.create_employer(**common_kwargs)
        else:
            user_id, user_data = self.user_repo.create_worker(**common_kwargs)

        user_public = UserPublic(**UserDocument.to_public(user_id, user_data))
        token = create_access_token(subject=user_id, extra_claims={"role": user_data["role"]})

        return TokenResponse(
            access_token=token,
            expires_in=settings.access_token_expire_minutes * 60,
            user=user_public,
        )

    def login(self, payload: LoginRequest) -> TokenResponse:
        result = self.user_repo.get_by_email(str(payload.email))
        if not result:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        user_id, user_data = result

        if not verify_password(payload.password, user_data["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        user_public = UserPublic(**UserDocument.to_public(user_id, user_data))
        token = create_access_token(subject=user_id, extra_claims={"role": user_data["role"]})

        return TokenResponse(
            access_token=token,
            expires_in=settings.access_token_expire_minutes * 60,
            user=user_public,
        )

    def verify_user(self, user_id: str) -> UserPublic:
        try:
            updated = self.user_repo.update_user(user_id, {"is_verified": True})
        except KeyError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            ) from exc

        return UserPublic(**UserDocument.to_public(user_id, updated))
