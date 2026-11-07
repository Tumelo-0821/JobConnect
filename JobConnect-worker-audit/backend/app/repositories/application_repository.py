
from datetime import datetime, timezone
from typing import Any

from google.cloud.firestore_v1.base_query import FieldFilter

from app.config import settings
from app.database import get_firestore
from app.models import new_id, utc_now


class FirestoreApplicationRepository:
    @property
    def collection(self):
        return get_firestore().collection(settings.firestore_applications_collection)

    def create(self, data: dict[str, Any]) -> tuple[str, dict[str, Any]]:
        app_id = new_id()
        self.collection.document(app_id).set(data)
        return app_id, data

    def get_by_id(self, app_id: str) -> tuple[str, dict[str, Any]] | None:
        doc = self.collection.document(app_id).get()
        if not doc.exists:
            return None
        return doc.id, doc.to_dict()

    def get_by_job_and_worker(self, job_id: str, worker_id: str) -> tuple[str, dict[str, Any]] | None:
        query = (
            self.collection
            .where(filter=FieldFilter("job_id", "==", job_id))
            .where(filter=FieldFilter("worker_id", "==", worker_id))
            .limit(1)
        )
        docs = list(query.stream())
        if not docs:
            return None
        doc = docs[0]
        return doc.id, doc.to_dict()

    def list_by_worker(self, worker_id: str) -> list[tuple[str, dict[str, Any]]]:
        query = self.collection.where(
            filter=FieldFilter("worker_id", "==", worker_id)
        )

        results = [(doc.id, doc.to_dict()) for doc in query.stream()]

        results.sort(
            key=lambda item: item[1].get("created_at") or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True,
        )

        return results

    def list_by_job(self, job_id: str) -> list[tuple[str, dict[str, Any]]]:
        query = self.collection.where(
            filter=FieldFilter("job_id", "==", job_id)
        )

        results = [(doc.id, doc.to_dict()) for doc in query.stream()]

        results.sort(
            key=lambda item: item[1].get("created_at") or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True,
        )

        return results

    def get_hired_by_job(self, job_id: str) -> tuple[str, dict[str, Any]] | None:
        query = (
            self.collection
            .where(filter=FieldFilter("job_id", "==", job_id))
            .where(filter=FieldFilter("status", "==", "hired"))
            .limit(1)
        )
        docs = list(query.stream())
        if not docs:
            return None
        doc = docs[0]
        return doc.id, doc.to_dict()

    def update(self, app_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        ref = self.collection.document(app_id)
        if not ref.get().exists:
            raise KeyError("Application not found")
        updates["updated_at"] = utc_now()
        ref.update(updates)
        return ref.get().to_dict()
