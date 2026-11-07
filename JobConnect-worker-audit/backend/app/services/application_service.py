
from datetime import datetime, timezone

from fastapi import HTTPException, status  # type: ignore[reportMissingImports]

from app.models import ApplicationDocument, JobStatus
from app.repositories.memory import ApplicationRepository, JobRepository, UserRepository
from app.schemas.application import ApplicationResponse, ApplicationStatus, ApplicationStatusUpdate
from app.repositories.notification_repository import NotificationRepository
from app.schemas.notification import NotificationType
from app.services.notification_service import NotificationService


class ApplicationService:
    def __init__(
        self,
        app_repo: ApplicationRepository,
        job_repo: JobRepository,
        user_repo: UserRepository,
        notification_repo: NotificationRepository,
    ) -> None:
        self.app_repo = app_repo
        self.job_repo = job_repo
        self.user_repo = user_repo
        self.notification_service = NotificationService(notification_repo)

    def apply(self, worker: dict, job_id: str) -> ApplicationResponse:
        job_result = self.job_repo.get_by_id(job_id)
        if not job_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )

        job_doc_id, job_data = job_result

        # Check whether the job's closing deadline has passed.
        closing_date = job_data.get("closing_date")

        if closing_date is not None:
            # Treat older datetimes without a timezone as UTC.
            if closing_date.tzinfo is None or closing_date.utcoffset() is None:
                closing_date = closing_date.replace(tzinfo=timezone.utc)
            else:
                closing_date = closing_date.astimezone(timezone.utc)

            if closing_date <= datetime.now(timezone.utc):
                # Automatically close an expired job.
                if job_data.get("status") == JobStatus.OPEN.value:
                    self.job_repo.update(
                        job_doc_id,
                        {"status": JobStatus.CLOSED.value},
                    )

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This job has expired and is no longer accepting applications.",
                )

        # Reject jobs that were closed manually or previously.
        if job_data.get("status") != JobStatus.OPEN.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This job is no longer accepting applications",
            )

        # Prevent the same worker from applying to the same job twice.
        existing = self.app_repo.get_by_job_and_worker(job_id, worker["id"])
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You have already applied for this job",
            )

        # Create and save the application.
        app_data = ApplicationDocument.create(
            job_id=job_id,
            worker_id=worker["id"],
            employer_id=job_data["employer_id"],
            job_title=job_data["title"],
        )
        app_id, created = self.app_repo.create(app_data)

        # Update the job's application count.
        self.job_repo.increment_application_count(job_id)

        # Notify the employer about the new application.
        self.notification_service.create_notification(
            recipient_id=job_data["employer_id"],
            notification_type=NotificationType.APPLICATION_RECEIVED,
            title="New job application",
            message=(
                f"{worker.get('first_name', 'A worker')} "
                f"has applied for your job '{job_data['title']}'."
            ),
            related_job_id=job_id,
            related_application_id=app_id,
        )

        return ApplicationResponse(
            **ApplicationDocument.to_response(app_id, created)
        )

    def list_worker_applications(self, worker_id: str) -> list[ApplicationResponse]:
        apps = self.app_repo.list_by_worker(worker_id)
        return [
            ApplicationResponse(
                **ApplicationDocument.to_response(app_id, data)
            )
            for app_id, data in apps
        ]

    def _get_worker_details(self, worker_id: str) -> dict:
        worker_result = self.user_repo.get_by_id(worker_id)

        if not worker_result:
            return {
                "worker_name": None,
                "worker_email": None,
                "worker_phone": None,
                "worker_skills": [],
                "worker_bio": None,
                "worker_province": None,
                "worker_cv_file_name": None,
                "worker_cv_available": False,
            }

        _, worker_data = worker_result

        worker_name = (
            f"{worker_data.get('first_name', '')} "
            f"{worker_data.get('last_name', '')}"
        ).strip()

        return {
            "worker_name": worker_name or None,
            "worker_email": worker_data.get("email"),
            "worker_phone": worker_data.get("phone"),
            "worker_skills": worker_data.get("skills", []),
            "worker_bio": worker_data.get("bio"),
            "worker_province": worker_data.get("province"),
            "worker_cv_file_name": worker_data.get("cv_file_name"),
            "worker_cv_available": bool(worker_data.get("cv_storage_path")),
        }

    def list_job_applications(
        self, employer_id: str, job_id: str
    ) -> list[ApplicationResponse]:
        job_result = self.job_repo.get_by_id(job_id)
        if not job_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )

        _, job_data = job_result

        if job_data.get("employer_id") != employer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view these applications",
            )

        apps = self.app_repo.list_by_job(job_id)
        results = []

        for app_id, data in apps:
            worker_details = self._get_worker_details(
                data.get("worker_id", "")
            )
            results.append(
                ApplicationResponse(
                    **ApplicationDocument.to_response(
                        app_id,
                        data,
                        **worker_details,
                    )
                )
            )

        return results

    def list_employer_applications(
        self, employer_id: str
    ) -> list[ApplicationResponse]:
        jobs = self.job_repo.list_by_employer(employer_id)
        results = []

        for job_id, job_data in jobs:
            apps = self.app_repo.list_by_job(job_id)

            for app_id, data in apps:
                worker_details = self._get_worker_details(
                    data.get("worker_id", "")
                )
                results.append(
                    ApplicationResponse(
                        **ApplicationDocument.to_response(
                            app_id,
                            data,
                            job_status=job_data.get("status"),
                            **worker_details,
                        )
                    )
                )

        return results

    def update_application_status(
        self,
        employer_id: str,
        job_id: str,
        app_id: str,
        payload: ApplicationStatusUpdate,
    ) -> ApplicationResponse:
        # Check that the job exists.
        job_result = self.job_repo.get_by_id(job_id)
        if not job_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )

        _, job_data = job_result

        # Make sure this employer owns the job.
        if job_data.get("employer_id") != employer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update this application",
            )

        # Check that the application exists.
        app_result = self.app_repo.get_by_id(app_id)
        if not app_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found",
            )

        _, app_data = app_result

        # Make sure this application belongs to this job.
        if app_data.get("job_id") != job_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found",
            )

        current_status = app_data.get("status")
        new_status = payload.status.value

        rejection_message = (payload.rejection_message or "").strip()

        if new_status == "rejected" and not rejection_message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please provide a rejection message",
            )

        # Do not allow changes to an already hired or rejected application.
        if current_status == "hired":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This application has already been hired",
            )

        if current_status == "rejected":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This application has already been rejected",
            )

        # Only one worker can be hired for a job.
        if new_status == "hired":
            hired_application = self.app_repo.get_hired_by_job(job_id)
            if hired_application:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A worker has already been hired for this job",
                )

        update_data = {"status": new_status}
        if new_status == "rejected":
            update_data["rejection_message"] = rejection_message

        updated = self.app_repo.update(app_id, update_data)
        worker_id = updated.get("worker_id")

        if worker_id and new_status == "hired":
            self.notification_service.create_notification(
                recipient_id=worker_id,
                notification_type=NotificationType.APPLICATION_HIRED,
                title="You have been hired!",
                message=(
                    f"Congratulations! You have been hired for "
                    f"'{job_data['title']}'."
                ),
                related_job_id=job_id,
                related_application_id=app_id,
            )

        elif worker_id and new_status == "rejected":
            self.notification_service.create_notification(
                recipient_id=worker_id,
                notification_type=NotificationType.APPLICATION_REJECTED,
                title="Application update",
                message=(
                    f"Your application for '{job_data['title']}' "
                    f"was not successful.\n\n"
                    f"Employer message:\n{rejection_message}"
                ),
                related_job_id=job_id,
                related_application_id=app_id,
            )

        worker_details = self._get_worker_details(
            updated.get("worker_id", "")
        )

        return ApplicationResponse(
            **ApplicationDocument.to_response(
                app_id,
                updated,
                **worker_details,
            )
        )

    def count_employer_applications(self, employer_id: str) -> int:
        jobs = self.job_repo.list_by_employer(employer_id)
        total = 0

        for job_id, _ in jobs:
            total += len(self.app_repo.list_by_job(job_id))

        return total

    def get_application_cv(
        self,
        employer_id: str,
        job_id: str,
        app_id: str,
    ) -> dict:
        # Check that the job exists.
        job_result = self.job_repo.get_by_id(job_id)
        if not job_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )

        _, job_data = job_result

        # Make sure this employer owns the job.
        if job_data.get("employer_id") != employer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this CV",
            )

        # Check that the application exists.
        app_result = self.app_repo.get_by_id(app_id)
        if not app_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found",
            )

        _, app_data = app_result

        # Make sure this application belongs to this job.
        if app_data.get("job_id") != job_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found",
            )

        worker_id = app_data.get("worker_id")
        if not worker_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Worker not found",
            )

        # Get the worker's CV information.
        worker_result = self.user_repo.get_by_id(worker_id)
        if not worker_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Worker not found",
            )

        _, worker_data = worker_result

        cv_path = worker_data.get("cv_storage_path")
        cv_file_name = worker_data.get("cv_file_name")

        if not cv_path or not cv_file_name:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="This worker has not uploaded a CV",
            )

        return {
            "worker_id": worker_id,
            "cv_file_name": cv_file_name,
            "cv_storage_path": cv_path,
        }
