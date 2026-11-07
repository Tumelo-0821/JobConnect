from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from app.repositories.memory import UserRepository


BASE_DIR = Path(__file__).resolve().parents[2]
CV_UPLOAD_DIR = BASE_DIR / "uploads" / "cvs"

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


class CVService:
    def __init__(self, user_repo: UserRepository) -> None:
        self.user_repo = user_repo

    async def upload_cv(
        self,
        worker: dict,
        file: UploadFile,
    ) -> dict:
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No CV file was provided",
            )

        extension = Path(file.filename).suffix.lower()

        if extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CV must be a PDF, DOC, or DOCX file",
            )

        file_content = await file.read()

        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CV file must not exceed 5 MB",
            )

        CV_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

        unique_filename = f"{uuid4().hex}{extension}"
        file_path = CV_UPLOAD_DIR / unique_filename

        file_path.write_bytes(file_content)

        relative_path = f"uploads/cvs/{unique_filename}"

        try:
            updated_user = self.user_repo.update_user(
                worker["id"],
                {
                    "cv_file_name": file.filename,
                    "cv_storage_path": relative_path,
                },
            )
        except KeyError as exc:
            file_path.unlink(missing_ok=True)

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Worker not found",
            ) from exc

        return {
            "message": "CV uploaded successfully",
            "cv_file_name": updated_user.get(
                "cv_file_name"
            ),
            "cv_storage_path": updated_user.get(
                "cv_storage_path"
            ),
        }