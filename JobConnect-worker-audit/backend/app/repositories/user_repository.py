from typing import Any

from google.cloud.firestore_v1.base_query import FieldFilter

from app.config import settings
from app.database import get_firestore
from app.models import UserDocument, UserRole, new_id, utc_now


class FirestoreUserRepository:
    @property
    def collection(self):
        return get_firestore().collection(settings.firestore_users_collection)

    def get_by_id(self, user_id: str) -> tuple[str, dict[str, Any]] | None:
        doc = self.collection.document(user_id).get()
        if not doc.exists:
            return None
        return doc.id, doc.to_dict()

    def get_by_email(self, email: str) -> tuple[str, dict[str, Any]] | None:
        query = self.collection.where(filter=FieldFilter("email", "==", email.lower().strip())).limit(1)
        docs = list(query.stream())
        if not docs:
            return None
        doc = docs[0]
        return doc.id, doc.to_dict()

    def create_employer(self, **kwargs: Any) -> tuple[str, dict[str, Any]]:
        doc = UserDocument.create(role=UserRole.EMPLOYER, **kwargs)
        user_id = new_id()
        self.collection.document(user_id).set(doc)
        return user_id, doc

    def create_worker(self, **kwargs: Any) -> tuple[str, dict[str, Any]]:
        doc = UserDocument.create(role=UserRole.WORKER, **kwargs)
        user_id = new_id()
        self.collection.document(user_id).set(doc)
        return user_id, doc

    def list_workers(
        self,
        *,
        search: str | None = None,
        skill: str | None = None,
    ) -> list[tuple[str, dict[str, Any]]]:
        query = self.collection.where(filter=FieldFilter("role", "==", UserRole.WORKER.value))
        results = [(doc.id, doc.to_dict()) for doc in query.stream()]

        if search:
            term = search.lower()
            results = [
                (uid, data)
                for uid, data in results
                if term in f"{data.get('first_name', '')} {data.get('last_name', '')}".lower()
                or any(term in s.lower() for s in data.get("skills", []))
            ]

        if skill:
            term = skill.lower()
            results = [
                (uid, data)
                for uid, data in results
                if any(term in s.lower() for s in data.get("skills", []))
                or term in f"{data.get('first_name', '')} {data.get('last_name', '')}".lower()
            ]

        results.sort(key=lambda item: item[1].get("created_at") or utc_now(), reverse=True)
        return results

    def update_user(self, user_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        ref = self.collection.document(user_id)
        if not ref.get().exists:
            raise KeyError("User not found")
        updates["updated_at"] = utc_now()
        ref.update(updates)
        return ref.get().to_dict()
