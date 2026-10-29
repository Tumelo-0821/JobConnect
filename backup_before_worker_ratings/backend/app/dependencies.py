from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.models import UserDocument, UserRole
from app.repositories.memory import UserRepository
from app.repositories.user_repository import FirestoreUserRepository
from app.security import decode_access_token
from app.repositories.notification_repository import NotificationRepository

security = HTTPBearer(auto_error=False)

_user_repo: UserRepository | None = None
_job_repo: Any | None = None
_application_repo: Any | None = None
_notification_repo: NotificationRepository | None = None


def set_repositories(user_repo: UserRepository, job_repo: Any, application_repo: Any | None = None) -> None:
    global _user_repo, _job_repo, _application_repo
    _user_repo = user_repo
    _job_repo = job_repo
    _application_repo = application_repo


def get_user_repository() -> UserRepository:
    if _user_repo is not None:
        return _user_repo
    return FirestoreUserRepository()


def get_job_repository():
    if _job_repo is not None:
        return _job_repo
    from app.repositories.job_repository import FirestoreJobRepository
    return FirestoreJobRepository()


def get_application_repository():
    if _application_repo is not None:
        return _application_repo
    from app.repositories.application_repository import FirestoreApplicationRepository
    return FirestoreApplicationRepository()


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    user_repo: UserRepository = Depends(get_user_repository),
) -> dict[str, Any]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(credentials.credentials)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = user_repo.get_by_id(user_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    doc_id, data = result
    return {"id": doc_id, **data}


def get_current_employer(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    if current_user.get("role") != UserRole.EMPLOYER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employer access required",
        )
    return current_user


def get_current_worker(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    if current_user.get("role") != UserRole.WORKER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Worker access required",
        )
    return current_user


def user_to_public(user: dict[str, Any]) -> dict[str, Any]:
    return UserDocument.to_public(user["id"], user)

def get_notification_repository() -> NotificationRepository:
    if _notification_repo is not None:
        return _notification_repo
    return NotificationRepository()
