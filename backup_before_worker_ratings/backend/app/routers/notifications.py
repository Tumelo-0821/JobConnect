from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import (
    get_current_user,
    get_notification_repository,
)
from app.repositories.notification_repository import NotificationRepository
from app.schemas.notification import NotificationResponse
from app.services.notification_service import NotificationService


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


def get_notification_service(
    notification_repo: NotificationRepository = Depends(
        get_notification_repository
    ),
) -> NotificationService:
    return NotificationService(notification_repo)


@router.get(
    "",
    response_model=list[NotificationResponse],
    summary="Get notifications for the current user",
)
def list_notifications(
    current_user: dict = Depends(get_current_user),
    notification_service: NotificationService = Depends(
        get_notification_service
    ),
) -> list[NotificationResponse]:
    return notification_service.list_notifications(
        current_user["id"]
    )


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    summary="Mark a notification as read",
)
def mark_notification_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    notification_service: NotificationService = Depends(
        get_notification_service
    ),
) -> NotificationResponse:
    try:
        return notification_service.mark_as_read(
            current_user["id"],
            notification_id,
        )
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this notification",
        )


@router.patch(
    "/read-all",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Mark all notifications as read",
)
def mark_all_notifications_as_read(
    current_user: dict = Depends(get_current_user),
    notification_service: NotificationService = Depends(
        get_notification_service
    ),
) -> None:
    notification_service.mark_all_as_read(
        current_user["id"]
    )