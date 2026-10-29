
from datetime import datetime, timezone
from typing import Any

from app.config import settings
from app.database import get_firestore


class OTPRepository:
    """Store registration OTP challenges separately from user records."""

    @property
    def collection(self):
        return get_firestore().collection(
            settings.firestore_registration_otps_collection
        )

    def create(self, challenge_id: str, data: dict[str, Any]) -> None:
        self.collection.document(challenge_id).set(data)

    def get(self, challenge_id: str) -> dict[str, Any] | None:
        snapshot = self.collection.document(challenge_id).get()

        if not snapshot.exists:
            return None

        return snapshot.to_dict()

    def update(self, challenge_id: str, updates: dict[str, Any]) -> None:
        self.collection.document(challenge_id).update(updates)

    def delete(self, challenge_id: str) -> None:
        self.collection.document(challenge_id).delete()
