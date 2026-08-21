from fastapi import HTTPException, status

from app.models import UserDocument
from app.repositories.memory import UserRepository
from app.schemas.auth import EmployerProfileUpdate, UserPublic


class EmployerService:
    def __init__(self, user_repo: UserRepository) -> None:
        self.user_repo = user_repo

    def get_profile(self, employer: dict) -> UserPublic:
        return UserPublic(**UserDocument.to_public(employer["id"], employer))

    def update_profile(self, employer: dict, payload: EmployerProfileUpdate) -> UserPublic:
        updates = payload.model_dump(exclude_unset=True, by_alias=False)

        field_map = {
            "first_name": "first_name",
            "last_name": "last_name",
            "phone": "phone",
            "province": "province",
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
            updated = self.user_repo.update_user(employer["id"], db_updates)
        except KeyError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employer not found",
            ) from exc

        employer_data = {**employer, **updated}
        return UserPublic(**UserDocument.to_public(employer["id"], employer_data))
