from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict


class NotificationType(str, Enum):
    JOB_MATCH = "job_match"
    APPLICATION_RECEIVED = "application_received"
    APPLICATION_HIRED = "application_hired"
    APPLICATION_REJECTED = "application_rejected"


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    recipient_id: str
    type: NotificationType
    title: str
    message: str
    related_job_id: str | None = None
    related_application_id: str | None = None
    is_read: bool = False
    created_at: datetime | None = None


class NotificationReadUpdate(BaseModel):
    is_read: bool