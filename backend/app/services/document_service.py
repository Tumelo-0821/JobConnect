
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from app.repositories.memory import UserRepository


BASE_DIR = Path(__file__).resolve().parents[2]
DOCUMENT_UPLOAD_DIR = BASE_DIR / "uploads" / "worker_documents"

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

ALLOWED_DOCUMENT_TYPES = {
    "certificate",
    "degree",
    "diploma",
    "training",
    "other",
}


class DocumentService:
    def __init__(self, user_repo: UserRepository) -> None:
        self.user_repo = user_repo

    async def upload_document(
        self,
        worker: dict,
        file: UploadFile,
        document_type: str,
    ) -> dict:
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No document was provided.",
            )

        document_type = document_type.strip().lower()

        if document_type not in ALLOWED_DOCUMENT_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid document type.",
            )

        extension = Path(file.filename).suffix.lower()

        if extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Document must be PDF, DOC, or DOCX.",
            )

        file_content = await file.read()

        if not file_content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded document is empty.",
            )

        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Document must not exceed 5 MB.",
            )

        DOCUMENT_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

        document_id = uuid4().hex
        unique_filename = f"{document_id}{extension}"
        file_path = DOCUMENT_UPLOAD_DIR / unique_filename

        file_path.write_bytes(file_content)

        relative_path = f"uploads/worker_documents/{unique_filename}"

        document = {
            "id": document_id,
            "worker_id": worker["id"],
            "document_name": file.filename,
            "document_type": document_type,
            "storage_path": relative_path,
        }

        try:
            user_result = self.user_repo.get_by_id(worker["id"])

            if not user_result:
                raise KeyError("Worker not found")

            _, user_data = user_result

            if user_data.get("role") != "worker":
                raise KeyError("Worker not found")

            documents = user_data.get("documents", [])
            documents.append(document)

            self.user_repo.update_user(
                worker["id"],
                {"documents": documents},
            )

        except KeyError as exc:
            file_path.unlink(missing_ok=True)

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Worker not found.",
            ) from exc

        except Exception:
            file_path.unlink(missing_ok=True)
            raise

        return {
            "message": "Document uploaded successfully.",
            "document": document,
        }

    def list_documents(self, worker: dict) -> list:
        user_result = self.user_repo.get_by_id(worker["id"])

        if not user_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Worker not found.",
            )

        _, user_data = user_result

        if user_data.get("role") != "worker":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Worker not found.",
            )

        return user_data.get("documents", [])