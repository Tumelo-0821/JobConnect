from app.models import NotificationDocument
from app.repositories.notification_repository import NotificationRepository
from app.schemas.notification import (
    NotificationResponse,
    NotificationType,
)
from app.services.sms_service import SMSService


class NotificationService:

    def __init__(
    self,
    notification_repo: NotificationRepository,
    ) -> None:
     self.notification_repo = notification_repo
     self.sms_service = SMSService()

    def create_notification(
        self,
        *,
        recipient_id: str,
        notification_type: NotificationType,
        title: str,
        message: str,
        related_job_id: str | None = None,
        related_application_id: str | None = None,
    ) -> NotificationResponse:

        notification_id, data = self.notification_repo.create(
            recipient_id=recipient_id,
            notification_type=notification_type.value,
            title=title,
            message=message,
            related_job_id=related_job_id,
            related_application_id=related_application_id,
        )

     # Send SMS in addition to the in-app notification
        self.sms_service.send_notification_sms(
            recipient_id=recipient_id,
            title=title,
            message=message,
        )

        return NotificationResponse(
            **NotificationDocument.to_response(
                notification_id,
                data,
            )
        )

    def list_notifications(
        self,
        recipient_id: str,
    ) -> list[NotificationResponse]:

        notifications = self.notification_repo.list_by_recipient(
            recipient_id
        )

        return [
            NotificationResponse(
                **NotificationDocument.to_response(
                    notification_id,
                    data,
                )
            )
            for notification_id, data in notifications
        ]

    def mark_as_read(
        self,
        recipient_id: str,
        notification_id: str,
    ) -> NotificationResponse:

        result = self.notification_repo.get_by_id(
            notification_id
        )

        if not result:
            raise KeyError("Notification not found")

        _, existing = result

        if existing.get("recipient_id") != recipient_id:
            raise PermissionError(
                "You do not have permission to update this notification"
            )

        updated = self.notification_repo.mark_as_read(
            notification_id
        )

        return NotificationResponse(
            **NotificationDocument.to_response(
                notification_id,
                updated,
            )
        )

    def mark_all_as_read(
        self,
        recipient_id: str,
    ) -> None:

        self.notification_repo.mark_all_as_read(
            recipient_id
        )
