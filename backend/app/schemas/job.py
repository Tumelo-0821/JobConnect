from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.auth import JobStatus, JobUrgency


def split_requirements(value: str | list[str] | None) -> list[str]:
    """Convert comma-separated or newline-separated text into a list."""
    if value is None:
        return []

    if isinstance(value, str):
        value = value.replace("\r\n", "\n").replace("\r", "\n")
        items = value.replace(",", "\n").split("\n")
    elif isinstance(value, list):
        items = value
    else:
        return []

    return [
        str(item).strip()
        for item in items
        if item is not None and str(item).strip()
    ]


class JobRequirementExtractionRequest(BaseModel):
    job_title: str = Field(..., min_length=3, max_length=200)
    job_description: str = Field(..., min_length=3, max_length=5000)

    @field_validator("job_title", "job_description")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()


class JobCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    category: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=3, max_length=5000)
    budget: str = Field(..., min_length=1, max_length=100)
    location: str = Field(..., min_length=1, max_length=200)
    province: str = Field(..., min_length=1, max_length=100)
    duration: str | None = Field(default=None, max_length=100)

    # Existing ATS fields
    required_skills: list[str] = Field(default_factory=list)
    required_experience: str | None = Field(default=None, max_length=200)
    education_requirements: str | None = Field(default=None, max_length=300)
    additional_requirements: list[str] = Field(default_factory=list)

    # Frontend ATS fields
    required_qualifications: str | None = Field(default=None, max_length=2000)
    required_certifications: str | None = Field(default=None, max_length=2000)
    ats_keywords: str | None = Field(default=None, max_length=2000)

    employment_type: str | None = Field(default=None, max_length=100)
    closing_date: datetime

    @model_validator(mode="before")
    @classmethod
    def map_frontend_ats_fields(cls, data):
        if not isinstance(data, dict):
            return data

        data = data.copy()

        qualifications = data.pop("required_qualifications", None)
        certifications = data.pop("required_certifications", None)
        keywords = data.pop("ats_keywords", None)

        if qualifications:
            data["education_requirements"] = qualifications

        additional = split_requirements(data.get("additional_requirements"))
        additional.extend(split_requirements(certifications))
        additional.extend(split_requirements(keywords))
        data["additional_requirements"] = additional

        data["required_skills"] = split_requirements(
            data.get("required_skills")
        )

        return data

    @field_validator(
        "title", "category", "description",
        "budget", "location", "province",
        mode="before",
    )
    @classmethod
    def strip_required(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("required_skills", "additional_requirements")
    @classmethod
    def normalize_lists(cls, value: list[str]) -> list[str]:
        return split_requirements(value)

    @field_validator("required_experience", "education_requirements")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if isinstance(value, str):
            return value.strip() or None
        return value

    @field_validator("closing_date")
    @classmethod
    def validate_closing_date(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Closing date must include a timezone.")

        if value <= datetime.now(timezone.utc):
            raise ValueError("Closing date must be in the future.")

        return value.astimezone(timezone.utc)


class JobUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, min_length=10, max_length=5000)
    budget: str | None = Field(default=None, min_length=1, max_length=100)
    location: str | None = Field(default=None, min_length=1, max_length=200)
    province: str | None = Field(default=None, max_length=100)
    duration: str | None = Field(default=None, max_length=100)

    required_skills: list[str] | None = None
    required_experience: str | None = Field(default=None, max_length=200)
    education_requirements: str | None = Field(default=None, max_length=300)
    additional_requirements: list[str] | None = None

    # Frontend ATS fields
    required_qualifications: str | None = Field(default=None, max_length=2000)
    required_certifications: str | None = Field(default=None, max_length=2000)
    ats_keywords: str | None = Field(default=None, max_length=2000)

    employment_type: str | None = Field(default=None, max_length=100)
    closing_date: datetime | None = None
    status: JobStatus | None = None

    @model_validator(mode="before")
    @classmethod
    def map_frontend_ats_fields(cls, data):
        if not isinstance(data, dict):
            return data

        data = data.copy()

        qualifications = data.pop("required_qualifications", None)
        certifications = data.pop("required_certifications", None)
        keywords = data.pop("ats_keywords", None)

        if qualifications is not None:
            data["education_requirements"] = qualifications

        additional = data.get("additional_requirements")

        if certifications is not None or keywords is not None:
            if additional is None:
                additional = []

            additional = split_requirements(additional)
            additional.extend(split_requirements(certifications))
            additional.extend(split_requirements(keywords))
            data["additional_requirements"] = additional

        if "required_skills" in data and data["required_skills"] is not None:
            data["required_skills"] = split_requirements(
                data["required_skills"]
            )

        return data

    @field_validator("required_skills", "additional_requirements")
    @classmethod
    def normalize_optional_lists(
        cls,
        value: list[str] | None,
    ) -> list[str] | None:
        if value is None:
            return None

        return split_requirements(value)

    @field_validator("required_experience", "education_requirements")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if isinstance(value, str):
            return value.strip() or None
        return value

    @field_validator("closing_date")
    @classmethod
    def validate_closing_date(
        cls,
        value: datetime | None,
    ) -> datetime | None:
        if value is None:
            return value

        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Closing date must include a timezone.")

        if value <= datetime.now(timezone.utc):
            raise ValueError("The closing date must be in the future.")

        return value.astimezone(timezone.utc)


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
    required_experience: str | None = None
    education_requirements: str | None = None
    additional_requirements: list[str] = Field(default_factory=list)

    employment_type: str | None = None
    closing_date: datetime | None = None
    status: JobStatus
    applications: int = 0
    created_at: datetime | None = None
    updated_at: datetime | None = None