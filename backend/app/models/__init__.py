from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import uuid4


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid4())


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


class ApplicationStatus(str, Enum):
    PENDING = "pending"
    HIRED = "hired"
    REJECTED = "rejected"


class UserDocument:
    """Firestore user document shape."""

    @staticmethod

    def create(
        *,
        email: str,
        password_hash: str,
        first_name: str,
        last_name: str | None,
        phone: str | None,
        province: str | None,
        role: UserRole,
        skills: list[str] | None = None,
        id_number: str | None = None,
        profile_photo_url: str | None = None,
    ) -> dict[str, Any]:
        now = utc_now()
        doc: dict[str, Any] = {
            "email": email.lower().strip(),
            "password_hash": password_hash,
            "first_name": first_name.strip(),
            "last_name": (last_name or "").strip(),
            "phone": (phone or "").strip() or None,
            "province": (province or "").strip() or None,
            "id_number": (id_number or "").strip() or None,
            "profile_photo_url": (profile_photo_url or "").strip() or None,
            "role": role.value,
            "is_verified": False,
            "created_at": now,
            "updated_at": now,
        }
        if role == UserRole.WORKER:
            doc["skills"] = skills or []
            doc["bio"] = None
            doc["rating"] = 0.0
            doc["review_count"] = 0
        return doc

    @staticmethod
    def to_public(doc_id: str, data: dict[str, Any]) -> dict[str, Any]:
        full_name = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip()
        result: dict[str, Any] = {
            "id": doc_id,
            "name": full_name,
            "email": data["email"],
            "first_name": data.get("first_name"),
            "last_name": data.get("last_name"),
            "phone": data.get("phone"),
            "province": data.get("province"),
            "id_number": data.get("id_number"),
            "profile_photo_url": data.get("profile_photo_url"),
            "role": data.get("role"),
            "verified": bool(data.get("is_verified", False)),
            "created_at": data.get("created_at"),
            "updated_at": data.get("updated_at"),
        }
        if data.get("role") == UserRole.WORKER.value:
            result["skills"] = data.get("skills", [])
            result["bio"] = data.get("bio")
            result["rating"] = float(data.get("rating", 0.0))
            result["review_count"] = int(data.get("review_count", 0))
        return result

    @staticmethod
    def to_worker_listing(doc_id: str, data: dict[str, Any]) -> dict[str, Any]:
        public = UserDocument.to_public(doc_id, data)
        skills = data.get("skills", [])
        skill_display = ", ".join(skills[:2]) if skills else "General Labour"
        location = data.get("province") or "South Africa"
        return {
            "id": doc_id,
            "name": public["name"],
            "skill": skill_display,
            "skills": skills,
            "location": location,
            "province": data.get("province"),
            "rating": float(data.get("rating", 0.0)),
            "reviews": int(data.get("review_count", 0)),
            "verified": bool(data.get("is_verified", False)),
        }


class JobDocument:
    """Firestore job document shape."""

    @staticmethod
    def create(
        *,
        employer_id: str,
        title: str,
        category: str,
        description: str,
        budget: str,
        location: str,
        province: str,
        duration: str | None = None,
        urgency: JobUrgency = JobUrgency.NORMAL,
        required_skills: list[str] | None = None,
        employment_type: str | None = None,
        closing_date: datetime | None = None,
    ) -> dict[str, Any]:
        now = utc_now()
        return {
            "employer_id": employer_id,
            "title": title.strip(),
            "category": category.strip(),
            "description": description.strip(),
            "budget": budget.strip(),
            "location": location.strip(),
            "province": province.strip(),
            "duration": (duration or "").strip() or None,
            "urgency": urgency.value,
            "required_skills": required_skills or [],
            "employment_type": (employment_type or "").strip() or None,
            "closing_date": closing_date,
            "status": JobStatus.OPEN.value,
            "application_count": 0,
            "created_at": now,
            "updated_at": now,
        }

    @staticmethod
    def to_response(doc_id: str, data: dict[str, Any]) -> dict[str, Any]:
        location_display = data.get("location", "")
        province = data.get("province")
        if province:
            abbrev = _province_abbrev(province)
            location_display = f"{location_display}, {abbrev}" if location_display else abbrev

        return {
            "id": doc_id,
            "employer_id": data.get("employer_id"),
            "title": data.get("title"),
            "category": data.get("category"),
            "description": data.get("description"),
            "budget": data.get("budget"),
            "pay": data.get("budget"),
            "location": location_display,
            "province": data.get("province"),
            "duration": data.get("duration"),
            "urgency": data.get("urgency"),
            "required_skills": data.get("required_skills", []),
            "employment_type": data.get("employment_type"),
            "closing_date": data.get("closing_date"),
            "status": data.get("status"),
            "applications": int(data.get("application_count", 0)),
            "created_at": data.get("created_at"),
            "updated_at": data.get("updated_at"),
        }


class ApplicationDocument:
    """Firestore job application document shape."""

    @staticmethod
    def create(
        *,
        job_id: str,
        worker_id: str,
        employer_id: str,
        job_title: str,
    ) -> dict[str, Any]:
        now = utc_now()
        return {
            "job_id": job_id,
            "worker_id": worker_id,
            "employer_id": employer_id,
            "job_title": job_title,
            "status": ApplicationStatus.PENDING.value,
            "created_at": now,
            "updated_at": now,
        }

    @staticmethod
    def to_response(
        doc_id: str,
        data: dict[str, Any],
        *,
        job_status: str | None = None,
        worker_name: str | None = None,
        worker_email: str | None = None,
        worker_phone: str | None = None,
        worker_skills: list[str] | None = None,
        worker_bio: str | None = None,
        worker_province: str | None = None,
    ) -> dict[str, Any]:
        return {
            "id": doc_id,
            "job_id": data.get("job_id"),
            "worker_id": data.get("worker_id"),
            "employer_id": data.get("employer_id"),
            "job_title": data.get("job_title"),
            "job_status": job_status,

            "worker_name": worker_name,
            "worker_email": worker_email,
            "worker_phone": worker_phone,
            "worker_skills": worker_skills or [],
            "worker_bio": worker_bio,
            "worker_province": worker_province,

            "status": data.get("status"),
            "created_at": data.get("created_at"),
            "updated_at": data.get("updated_at"),
        }


def _province_abbrev(province: str) -> str:
    mapping = {
        "Gauteng": "GP",
        "Western Cape": "WC",
        "KwaZulu-Natal": "KZN",
        "Eastern Cape": "EC",
        "Limpopo": "LP",
        "Mpumalanga": "MP",
        "North West": "NW",
        "Free State": "FS",
        "Northern Cape": "NC",
    }
    return mapping.get(province, province)
