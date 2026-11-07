
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException, status

from app.config import settings
from app.models import UserDocument, UserRole
from app.repositories.memory import UserRepository
from app.repositories.otp_repository import OTPRepository
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    OTPRegisterRequest,
    OTPVerifyRequest,
    TokenResponse,
    UserPublic,
)
from app.security import create_access_token, hash_password, verify_password
from app.services.otp_delivery_service import (
    OTPDeliveryError,
    OTPDeliveryService,
)
from app.services.otp_service import (
    OTP_EXPIRY_MINUTES,
    OTP_MAX_ATTEMPTS,
    generate_otp,
    hash_otp,
    otp_expiry_time,
    verify_otp_value,
)


class AuthService:
    def __init__(
        self,
        user_repo: UserRepository,
        otp_repo: OTPRepository | None = None,
        otp_delivery: OTPDeliveryService | None = None,
    ) -> None:
        self.user_repo = user_repo
        self.otp_repo = otp_repo or OTPRepository()
        self.otp_delivery = otp_delivery or OTPDeliveryService()

    def _create_token_response(
        self, user_id: str, user_data: dict
    ) -> TokenResponse:
        user_public = UserPublic(**UserDocument.to_public(user_id, user_data))
        token = create_access_token(
            subject=user_id,
            extra_claims={"role": user_data["role"]},
        )
        return TokenResponse(
            access_token=token,
            expires_in=settings.access_token_expire_minutes * 60,
            user=user_public,
        )

    def register(self, payload: RegisterRequest) -> TokenResponse:
        """Legacy registration retained for compatibility."""
        existing = self.user_repo.get_by_email(str(payload.email))
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

        return self._create_token_response(user_id, user_data)

    def start_otp_registration(self, payload: OTPRegisterRequest) -> dict:
        email = str(payload.email).lower().strip()
        existing = self.user_repo.get_by_email(email)

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists",
            )

        if payload.verification_method == "sms" and not payload.phone:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="A phone number is required for SMS verification.",
            )

        challenge_id = str(uuid4())
        otp = generate_otp()

        challenge = {
            "email": email,
            "phone": payload.phone,
            "verification_method": payload.verification_method,
            "password_hash": hash_password(payload.password),
            "first_name": payload.first_name,
            "last_name": payload.last_name,
            "province": payload.province,
            "role": payload.role.value,
            "id_number": payload.id_number,
            "otp_hash": hash_otp(otp, challenge_id),
            "expires_at": otp_expiry_time(),
            "attempts": 0,
            "resend_count": 0,
            "created_at": datetime.now(timezone.utc),
            "verified": False,
        }

        self.otp_repo.create(challenge_id, challenge)

        try:
            if payload.verification_method == "email":
                self.otp_delivery.send_email(email, otp)
            else:
                self.otp_delivery.send_sms(payload.phone or "", otp)
        except OTPDeliveryError as exc:
            self.otp_repo.delete(challenge_id)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(exc),
            ) from exc

        return {
            "message": "Verification code sent. Check your selected contact method.",
            "challenge_id": challenge_id,
            "expires_in_seconds": OTP_EXPIRY_MINUTES * 60,
        }

    def verify_otp_registration(self, payload: OTPVerifyRequest) -> TokenResponse:
        challenge = self.otp_repo.get(payload.challenge_id)

        if not challenge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Verification request not found. Please register again.",
            )

        if challenge.get("verified"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This verification request has already been used.",
            )

        expires_at = challenge.get("expires_at")
        if not expires_at or expires_at <= datetime.now(timezone.utc):
            self.otp_repo.delete(payload.challenge_id)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The verification code has expired. Please register again.",
            )

        attempts = int(challenge.get("attempts", 0))
        if attempts >= OTP_MAX_ATTEMPTS:
            self.otp_repo.delete(payload.challenge_id)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many incorrect attempts. Please register again.",
            )

        if not verify_otp_value(
            payload.otp,
            payload.challenge_id,
            challenge["otp_hash"],
        ):
            attempts += 1
            if attempts >= OTP_MAX_ATTEMPTS:
                self.otp_repo.delete(payload.challenge_id)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many incorrect attempts. Please register again.",
                )

            self.otp_repo.update(
                payload.challenge_id,
                {"attempts": attempts},
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect verification code.",
            )

        email = challenge["email"]
        if self.user_repo.get_by_email(email):
            self.otp_repo.delete(payload.challenge_id)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists",
            )

        common_kwargs = {
            "email": email,
            "password_hash": challenge["password_hash"],
            "first_name": challenge["first_name"],
            "last_name": challenge.get("last_name"),
            "phone": challenge.get("phone"),
            "province": challenge.get("province"),
        }

        if challenge["role"] == UserRole.EMPLOYER.value:
            user_id, user_data = self.user_repo.create_employer(**common_kwargs)
        else:
            user_id, user_data = self.user_repo.create_worker(**common_kwargs)

        # OTP verifies the account contact method, not the person's identity.
        user_data["account_verified"] = True
        user_data["is_verified"] = False
        user_data["id_number"] = challenge.get("id_number")

        self.user_repo.update_user(
            user_id,
            {
                "account_verified": True,
                "is_verified": False,
                "id_number": challenge.get("id_number"),
            },
        )

        self.otp_repo.delete(payload.challenge_id)
        return self._create_token_response(user_id, user_data)

    def resend_otp(self, challenge_id: str) -> dict:
        challenge = self.otp_repo.get(challenge_id)

        if not challenge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Verification request not found. Please register again.",
            )

        if challenge.get("verified"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This verification request has already been used.",
            )

        if int(challenge.get("resend_count", 0)) >= 3:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Resend limit reached. Please register again.",
            )

        otp = generate_otp()
        updates = {
            "otp_hash": hash_otp(otp, challenge_id),
            "expires_at": otp_expiry_time(),
            "attempts": 0,
            "resend_count": int(challenge.get("resend_count", 0)) + 1,
        }

        try:
            if challenge["verification_method"] == "email":
                self.otp_delivery.send_email(challenge["email"], otp)
            else:
                self.otp_delivery.send_sms(challenge.get("phone") or "", otp)
        except OTPDeliveryError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(exc),
            ) from exc

        self.otp_repo.update(challenge_id, updates)

        return {
            "message": "A new verification code was requested.",
            "expires_in_seconds": OTP_EXPIRY_MINUTES * 60,
        }

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

        return self._create_token_response(user_id, user_data)

    def verify_user(self, user_id: str) -> UserPublic:
        """Identity verification remains separate from OTP verification."""
        try:
            updated = self.user_repo.update_user(user_id, {"is_verified": True})
        except KeyError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            ) from exc

        return UserPublic(**UserDocument.to_public(user_id, updated))
