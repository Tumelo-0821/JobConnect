from typing import Any

from google.cloud.firestore_v1.base_query import FieldFilter

from app.config import settings
from app.database import get_firestore
from app.models import NotificationDocument, new_id, utc_now


class NotificationRepository:

    @property
    def collection(self):
        return get_firestore().collection("notifications")

    def create(
        self,
        *,
        recipient_id: str,
        notification_type: str,
        title: str,
        message: str,
        related_job_id: str | None = None,
        related_application_id: str | None = None,
    ) -> tuple[str, dict[str, Any]]:

        data = NotificationDocument.create(
            recipient_id=recipient_id,
            notification_type=notification_type,
            title=title,
            message=message,
            related_job_id=related_job_id,
            related_application_id=related_application_id,
        )

        notification_id = new_id()

        self.collection.document(notification_id).set(data)

        return notification_id, data

    def list_by_recipient(
        self,
        recipient_id: str,
    ) -> list[tuple[str, dict[str, Any]]]:

        query = (
            self.collection
            .where(
                filter=FieldFilter(
                    "recipient_id",
                    "==",
                    recipient_id,
                )
            )
        )

        results = [
            (doc.id, doc.to_dict())
            for doc in query.stream()
        ]

        results.sort(
            key=lambda item: item[1].get("created_at") or utc_now(),
            reverse=True,
        )

        return results

    def get_by_id(
        self,
        notification_id: str,
    ) -> tuple[str, dict[str, Any]] | None:

        doc = self.collection.document(notification_id).get()

        if not doc.exists:
            return None

        return doc.id, doc.to_dict()

    def mark_as_read(
        self,
        notification_id: str,
    ) -> dict[str, Any]:

        ref = self.collection.document(notification_id)

        if not ref.get().exists:
            raise KeyError("Notification not found")

        ref.update({
            "is_read": True,
            "updated_at": utc_now(),
        })

        return ref.get().to_dict()

    def mark_all_as_read(
        self,
        recipient_id: str,
    ) -> None:

        notifications = self.list_by_recipient(recipient_id)

        batch = get_firestore().batch()

        for notification_id, data in notifications:
            if not data.get("is_read", False):
                ref = self.collection.document(notification_id)

                batch.update(
                    ref,
                    {
                        "is_read": True,
                        "updated_at": utc_now(),
                    },
                )

        batch.commit()