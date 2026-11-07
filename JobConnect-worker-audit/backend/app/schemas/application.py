from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict


class ApplicationStatus(str, Enum):
     PENDING = "pending"
     HIRED = "hired"
     REJECTED = "rejected"


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    job_id: str
    worker_id: str
    employer_id: str
    job_title: str
    job_status: str | None = None

    worker_name: str | None = None
    worker_email: str | None = None
    worker_phone: str | None = None
    worker_skills: list[str] = []
    worker_bio: str | None = None
    worker_province: str | None = None
    worker_cv_file_name: str | None = None
    worker_cv_available: bool = False

    status: ApplicationStatus
    created_at: datetime | None = None
    updated_at: datetime | None = None
    work_status: str = "in_progress"
    review_submitted: bool = False
    worker_rating: float | None = None


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus
    rejection_message: str | None = None