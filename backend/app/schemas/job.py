from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.auth import JobStatus, JobUrgency


class JobCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    category: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=3, max_length=5000)
    budget: str = Field(..., min_length=1, max_length=100)
    location: str = Field(..., min_length=1, max_length=200)
    province: str = Field(..., min_length=1, max_length=100)
    duration: str | None = Field(default=None, max_length=100)
    urgency: JobUrgency = JobUrgency.NORMAL
    required_skills: list[str] = Field(default_factory=list)
    employment_type: str | None = Field(default=None, max_length=100)
    closing_date: datetime | None = None

    @field_validator("title", "category", "description", "budget", "location", "province", mode="before")
    @classmethod
    def strip_required(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("required_skills")
    @classmethod
    def normalize_skills(cls, value: list[str]) -> list[str]:
        return [skill.strip() for skill in value if skill and skill.strip()]


class JobUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, min_length=10, max_length=5000)
    budget: str | None = Field(default=None, min_length=1, max_length=100)
    location: str | None = Field(default=None, min_length=1, max_length=200)
    province: str | None = Field(default=None, min_length=1, max_length=100)
    duration: str | None = Field(default=None, max_length=100)
    urgency: JobUrgency | None = None
    required_skills: list[str] | None = None
    employment_type: str | None = Field(default=None, max_length=100)
    closing_date: datetime | None = None
    status: JobStatus | None = None


class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    employer_id: str
    title: str
    category: str
    description: str
    budget: str
    pay: str
    location: str
    province: str | None = None
    duration: str | None = None
    urgency: JobUrgency | None = None
    required_skills: list[str] = Field(default_factory=list)
    employment_type: str | None = None
    closing_date: datetime | None = None
    status: JobStatus
    applications: int = 0
    created_at: datetime | None = None
    updated_at: datetime | None = None
