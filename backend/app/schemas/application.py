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

    status: ApplicationStatus
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus
