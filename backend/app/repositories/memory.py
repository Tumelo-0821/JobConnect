from typing import Any, Protocol

from app.models import JobDocument, UserDocument, UserRole, utc_now


class UserRepository(Protocol):
    def get_by_id(self, user_id: str) -> tuple[str, dict[str, Any]] | None: ...

    def get_by_email(self, email: str) -> tuple[str, dict[str, Any]] | None: ...

    def create_employer(self, **kwargs: Any) -> tuple[str, dict[str, Any]]: ...

    def create_worker(self, **kwargs: Any) -> tuple[str, dict[str, Any]]: ...

    def list_workers(
        self,
        *,
        search: str | None = None,
        skill: str | None = None,
    ) -> list[tuple[str, dict[str, Any]]]: ...

    def update_user(self, user_id: str, updates: dict[str, Any]) -> dict[str, Any]: ...


class JobRepository(Protocol):
    def create(self, data: dict[str, Any]) -> tuple[str, dict[str, Any]]: ...

    def get_by_id(self, job_id: str) -> tuple[str, dict[str, Any]] | None: ...

    def list_by_employer(self, employer_id: str) -> list[tuple[str, dict[str, Any]]]: ...

    def list_open_jobs(
        self,
        *,
        category: str | None = None,
        province: str | None = None,
    ) -> list[tuple[str, dict[str, Any]]]: ...

    def increment_application_count(self, job_id: str) -> None: ...

    def update(self, job_id: str, updates: dict[str, Any]) -> dict[str, Any]: ...

    def delete(self, job_id: str) -> None: ...


class ApplicationRepository(Protocol):
    def create(self, data: dict[str, Any]) -> tuple[str, dict[str, Any]]: ...

    def get_by_id(self, app_id: str) -> tuple[str, dict[str, Any]] | None: ...

    def get_by_job_and_worker(self, job_id: str, worker_id: str) -> tuple[str, dict[str, Any]] | None: ...

    def list_by_worker(self, worker_id: str) -> list[tuple[str, dict[str, Any]]]: ...

    def list_by_job(self, job_id: str) -> list[tuple[str, dict[str, Any]]]: ...

    def update(self, app_id: str, updates: dict[str, Any]) -> dict[str, Any]: ...


class InMemoryUserRepository:
    def __init__(self) -> None:
        self._users: dict[str, dict[str, Any]] = {}
        self._email_index: dict[str, str] = {}

    def clear(self) -> None:
        self._users.clear()
        self._email_index.clear()

    def get_by_id(self, user_id: str) -> tuple[str, dict[str, Any]] | None:
        data = self._users.get(user_id)
        if not data:
            return None
        return user_id, data.copy()

    def get_by_email(self, email: str) -> tuple[str, dict[str, Any]] | None:
        user_id = self._email_index.get(email.lower().strip())
        if not user_id:
            return None
        return user_id, self._users[user_id].copy()

    def create_employer(self, **kwargs: Any) -> tuple[str, dict[str, Any]]:
        from app.models import new_id

        doc = UserDocument.create(role=UserRole.EMPLOYER, **kwargs)
        user_id = new_id()
        self._users[user_id] = doc
        self._email_index[doc["email"]] = user_id
        return user_id, doc.copy()

    def create_worker(self, **kwargs: Any) -> tuple[str, dict[str, Any]]:
        from app.models import new_id

        doc = UserDocument.create(role=UserRole.WORKER, **kwargs)
        user_id = new_id()
        self._users[user_id] = doc
        self._email_index[doc["email"]] = user_id
        return user_id, doc.copy()

    def list_workers(
        self,
        *,
        search: str | None = None,
        skill: str | None = None,
    ) -> list[tuple[str, dict[str, Any]]]:
        results = [
            (user_id, data.copy())
            for user_id, data in self._users.items()
            if data.get("role") == UserRole.WORKER.value
        ]

        if search:
            term = search.lower()
            results = [
                (uid, data)
                for uid, data in results
                if term in f"{data.get('first_name', '')} {data.get('last_name', '')}".lower()
                or any(term in s.lower() for s in data.get("skills", []))
            ]

        if skill:
            term = skill.lower()
            results = [
                (uid, data)
                for uid, data in results
                if any(term in s.lower() for s in data.get("skills", []))
            ]

        results.sort(key=lambda item: item[1].get("created_at") or utc_now(), reverse=True)
        return results

    def update_user(self, user_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        if user_id not in self._users:
            raise KeyError("User not found")
        self._users[user_id].update(updates)
        self._users[user_id]["updated_at"] = utc_now()
        return self._users[user_id].copy()


class InMemoryJobRepository:
    def __init__(self) -> None:
        self._jobs: dict[str, dict[str, Any]] = {}

    def clear(self) -> None:
        self._jobs.clear()

    def create(self, data: dict[str, Any]) -> tuple[str, dict[str, Any]]:
        from app.models import new_id

        job_id = new_id()
        self._jobs[job_id] = data.copy()
        return job_id, self._jobs[job_id].copy()

    def get_by_id(self, job_id: str) -> tuple[str, dict[str, Any]] | None:
        data = self._jobs.get(job_id)
        if not data:
            return None
        return job_id, data.copy()

    def list_by_employer(self, employer_id: str) -> list[tuple[str, dict[str, Any]]]:
        results = [
            (job_id, data.copy())
            for job_id, data in self._jobs.items()
            if data.get("employer_id") == employer_id
        ]
        results.sort(key=lambda item: item[1].get("created_at") or utc_now(), reverse=True)
        return results

    def list_open_jobs(
        self,
        *,
        category: str | None = None,
        province: str | None = None,
    ) -> list[tuple[str, dict[str, Any]]]:
        results = [
            (job_id, data.copy())
            for job_id, data in self._jobs.items()
            if data.get("status") == "open"
        ]

        if category:
            term = category.lower()
            results = [(jid, data) for jid, data in results if term in data.get("category", "").lower()]

        if province:
            term = province.lower()
            results = [(jid, data) for jid, data in results if term in data.get("province", "").lower()]

        results.sort(key=lambda item: item[1].get("created_at") or utc_now(), reverse=True)
        return results

    def increment_application_count(self, job_id: str) -> None:
        if job_id not in self._jobs:
            raise KeyError("Job not found")
        current = int(self._jobs[job_id].get("application_count", 0))
        self._jobs[job_id]["application_count"] = current + 1
        self._jobs[job_id]["updated_at"] = utc_now()

    def update(self, job_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        if job_id not in self._jobs:
            raise KeyError("Job not found")
        self._jobs[job_id].update(updates)
        self._jobs[job_id]["updated_at"] = utc_now()
        return self._jobs[job_id].copy()

    def delete(self, job_id: str) -> None:
        if job_id not in self._jobs:
            raise KeyError("Job not found")
        del self._jobs[job_id]


class InMemoryApplicationRepository:
    def __init__(self) -> None:
        self._applications: dict[str, dict[str, Any]] = {}

    def clear(self) -> None:
        self._applications.clear()

    def create(self, data: dict[str, Any]) -> tuple[str, dict[str, Any]]:
        from app.models import new_id

        app_id = new_id()
        self._applications[app_id] = data.copy()
        return app_id, self._applications[app_id].copy()

    def get_by_id(self, app_id: str) -> tuple[str, dict[str, Any]] | None:
        data = self._applications.get(app_id)
        if not data:
            return None
        return app_id, data.copy()

    def get_by_job_and_worker(self, job_id: str, worker_id: str) -> tuple[str, dict[str, Any]] | None:
        for app_id, data in self._applications.items():
            if data.get("job_id") == job_id and data.get("worker_id") == worker_id:
                return app_id, data.copy()
        return None

    def list_by_worker(self, worker_id: str) -> list[tuple[str, dict[str, Any]]]:
        results = [
            (app_id, data.copy())
            for app_id, data in self._applications.items()
            if data.get("worker_id") == worker_id
        ]
        results.sort(key=lambda item: item[1].get("created_at") or utc_now(), reverse=True)
        return results

    def list_by_job(self, job_id: str) -> list[tuple[str, dict[str, Any]]]:
        results = [
            (app_id, data.copy())
            for app_id, data in self._applications.items()
            if data.get("job_id") == job_id
        ]
        results.sort(key=lambda item: item[1].get("created_at") or utc_now(), reverse=True)
        return results

    def update(self, app_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        if app_id not in self._applications:
            raise KeyError("Application not found")
        self._applications[app_id].update(updates)
        self._applications[app_id]["updated_at"] = utc_now()
        return self._applications[app_id].copy()
