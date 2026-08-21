from fastapi import HTTPException, status

from app.models import UserDocument
from app.repositories.memory import UserRepository
from app.schemas.auth import UserPublic, WorkerListing, WorkerProfileUpdate


class WorkerService:
    def __init__(self, user_repo: UserRepository) -> None:
        self.user_repo = user_repo

    def get_profile(self, worker: dict) -> UserPublic:
        return UserPublic(**UserDocument.to_public(worker["id"], worker))

    def update_profile(self, worker: dict, payload: WorkerProfileUpdate) -> UserPublic:
        updates = payload.model_dump(exclude_unset=True, by_alias=False)

        field_map = {
            "first_name": "first_name",
            "last_name": "last_name",
            "phone": "phone",
            "province": "province",
            "id_number": "id_number",
            "profile_photo_url": "profile_photo_url",
            "skills": "skills",
            "bio": "bio",
        }

        db_updates = {}
        for schema_field, db_field in field_map.items():
            if schema_field in updates:
                db_updates[db_field] = updates[schema_field]

        if not db_updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields provided for update",
            )

        try:
            updated = self.user_repo.update_user(worker["id"], db_updates)
        except KeyError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Worker not found",
            ) from exc

        worker_data = {**worker, **updated}
        return UserPublic(**UserDocument.to_public(worker["id"], worker_data))

    def list_workers(
        self,
        *,
        search: str | None = None,
        skill: str | None = None,
    ) -> list[WorkerListing]:
        workers = self.user_repo.list_workers(search=search, skill=skill)
        return [
            WorkerListing(**UserDocument.to_worker_listing(worker_id, data))
            for worker_id, data in workers
        ]

    def get_worker(self, worker_id: str) -> WorkerListing:
        result = self.user_repo.get_by_id(worker_id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Worker not found",
            )

        doc_id, data = result
        if data.get("role") != "worker":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Worker not found",
            )

        return WorkerListing(**UserDocument.to_worker_listing(doc_id, data))
