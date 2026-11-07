from typing import Any

from google.cloud.firestore_v1.base_query import FieldFilter

from app.config import settings
from app.database import get_firestore
from app.models import utc_now


class FirestoreJobRepository:
    @property
    def collection(self):
        return get_firestore().collection(settings.firestore_jobs_collection)

    def create(self, data: dict[str, Any]) -> tuple[str, dict[str, Any]]:
        from app.models import new_id

        job_id = new_id()
        self.collection.document(job_id).set(data)
        return job_id, data

    def get_by_id(self, job_id: str) -> tuple[str, dict[str, Any]] | None:
        doc = self.collection.document(job_id).get()
        if not doc.exists:
            return None
        return doc.id, doc.to_dict()

    def list_by_employer(self, employer_id: str) -> list[tuple[str, dict[str, Any]]]:
        query = (
            self.collection
            .where(filter=FieldFilter("employer_id", "==", employer_id))
            .order_by("created_at", direction="DESCENDING")
        )
        return [(doc.id, doc.to_dict()) for doc in query.stream()]

    def list_open_jobs(
        self,
        *,
        category: str | None = None,
        province: str | None = None,
    ) -> list[tuple[str, dict[str, Any]]]:
        query = self.collection.where(filter=FieldFilter("status", "==", "open"))
        results = [(doc.id, doc.to_dict()) for doc in query.stream()]

        if category:
            term = category.lower()
            results = [(jid, data) for jid, data in results if term in data.get("category", "").lower()]

        if province:
            term = province.lower()
            results = [(jid, data) for jid, data in results if term in data.get("province", "").lower()]

        results.sort(key=lambda item: item[1].get("created_at") or utc_now(), reverse=True)
        return results

    def increment_application_count(self, job_id: str) -> None:
        ref = self.collection.document(job_id)
        doc = ref.get()
        if not doc.exists:
            raise KeyError("Job not found")
        current = int(doc.to_dict().get("application_count", 0))
        ref.update({"application_count": current + 1, "updated_at": utc_now()})

    def update(self, job_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        ref = self.collection.document(job_id)
        if not ref.get().exists:
            raise KeyError("Job not found")
        updates["updated_at"] = utc_now()
        ref.update(updates)
        return ref.get().to_dict()

    def delete(self, job_id: str) -> None:
        ref = self.collection.document(job_id)
        if not ref.get().exists:
            raise KeyError("Job not found")
        ref.delete()
