from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserRole(str, Enum):
    WORKER = "worker"
    EMPLOYER = "employer"


class JobStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"


class JobUrgency(str, Enum):
    NORMAL = "normal"
    SOON = "soon"
    URGENT = "urgent"


class MessageResponse(BaseModel):
    message: str


class ErrorResponse(BaseModel):
    detail: str | list[dict]


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    province: str | None = None
    role: UserRole
    verified: bool
    skills: list[str] | None = None
    bio: str | None = None
    rating: float | None = None
    review_count: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

class RegisterRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100, alias="firstName")
    last_name: str | None = Field(default=None, max_length=100, alias="lastName")
    email: EmailStr
    phone: str | None = Field(default=None, max_length=20)
    province: str | None = Field(default=None, max_length=100, alias="city")
    password: str = Field(..., min_length=6, max_length=128)
    role: UserRole = UserRole.EMPLOYER

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("first_name", "last_name", "phone", "province", mode="before")
    @classmethod
    def strip_strings(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if isinstance(value, str):
            stripped = value.strip()
            return stripped or None
        return value

    @field_validator("role")
    @classmethod
    def must_be_valid_role(cls, value: UserRole) -> UserRole:
        if value not in (UserRole.EMPLOYER, UserRole.WORKER):
            raise ValueError("Role must be employer or worker")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserPublic


class WorkerProfileUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100, alias="firstName")
    last_name: str | None = Field(default=None, max_length=100, alias="lastName")
    phone: str | None = Field(default=None, max_length=20)
    province: str | None = Field(default=None, max_length=100, alias="city")
    id_number: str | None = Field(default=None, min_length=13, max_length=13)
    profile_photo_url: str | None = None
    skills: list[str] | None = None
    bio: str | None = Field(default=None, max_length=1000)
    model_config = ConfigDict(populate_by_name=True)

    @field_validator("first_name", "last_name", "phone", "province", "bio", mode="before")
    @classmethod
    def strip_strings(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if isinstance(value, str):
            stripped = value.strip()
            return stripped or None
        return value

    @field_validator("skills")
    @classmethod
    def normalize_skills(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        return [skill.strip() for skill in value if skill and skill.strip()]


class WorkerListing(BaseModel):
    id: str
    name: str
    skill: str
    skills: list[str] = Field(default_factory=list)
    location: str
    province: str | None = None
    rating: float = 0.0
    reviews: int = 0
    verified: bool = False


class EmployerProfileUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100, alias="firstName")
    last_name: str | None = Field(default=None, max_length=100, alias="lastName")
    phone: str | None = Field(default=None, max_length=20)
    province: str | None = Field(default=None, max_length=100, alias="city")

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("first_name", "last_name", "phone", "province", mode="before")
    @classmethod
    def strip_strings(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if isinstance(value, str):
            stripped = value.strip()
            return stripped or None
        return value
