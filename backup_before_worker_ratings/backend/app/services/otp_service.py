
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from app.config import settings


OTP_LENGTH = 6
OTP_EXPIRY_MINUTES = 10
OTP_MAX_ATTEMPTS = 5


def generate_otp() -> str:
    """Generate a cryptographically secure six-digit OTP."""
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_otp(otp: str, challenge_id: str) -> str:
    """Hash an OTP so the original code is not stored."""
    message = f"{challenge_id}:{otp}".encode("utf-8")
    secret = settings.jwt_secret_key.encode("utf-8")
    return hmac.new(secret, message, hashlib.sha256).hexdigest()


def otp_expiry_time() -> datetime:
    """Return the UTC expiry time for a newly generated OTP."""
    return datetime.now(timezone.utc) + timedelta(
        minutes=OTP_EXPIRY_MINUTES
    )


def verify_otp_value(
    submitted_otp: str,
    challenge_id: str,
    stored_hash: str,
) -> bool:
    """Compare a submitted OTP against its stored hash."""
    if len(submitted_otp) != OTP_LENGTH or not submitted_otp.isdigit():
        return False

    expected_hash = hash_otp(submitted_otp, challenge_id)
    return hmac.compare_digest(expected_hash, stored_hash)
