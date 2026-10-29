
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import (
    get_application_repository,
    get_current_employer,
    get_job_repository,
    get_user_repository,
)
from app.models import utc_now
from app.schemas.worker_review import WorkerReviewCreate

router = APIRouter(prefix="/employers", tags=["Employer Work Reviews"])


def get_owned_hired_application(
    job_id: str,
    application_id: str,
    employer: dict[str, Any],
    job_repo: Any,
    application_repo: Any,
) -> tuple[dict[str, Any], dict[str, Any]]:
    job_result = job_repo.get_by_id(job_id)

    if not job_result:
        raise HTTPException(status_code=404, detail="Job not found")

    _, job = job_result

    if job.get("employer_id") != employer["id"]:
        raise HTTPException(
            status_code=403,
            detail="You do not own this job",
        )

    application_result = application_repo.get_by_id(application_id)

    if not application_result:
        raise HTTPException(status_code=404, detail="Application not found")

    _, application = application_result

    if application.get("job_id") != job_id:
        raise HTTPException(
            status_code=400,
            detail="This application does not belong to this job",
        )

    if application.get("status") != "hired":
        raise HTTPException(
            status_code=400,
            detail="Only hired workers can have completed work or receive reviews",
        )

    return job, application


@router.post("/jobs/{job_id}/applications/{application_id}/complete")
def mark_work_completed(
    job_id: str,
    application_id: str,
    employer: dict[str, Any] = Depends(get_current_employer),
    job_repo: Any = Depends(get_job_repository),
    application_repo: Any = Depends(get_application_repository),
):
    _, application = get_owned_hired_application(
        job_id, application_id, employer, job_repo, application_repo
    )

    if application.get("work_status") == "completed":
        return {
            "message": "Work has already been marked as completed",
            "work_status": "completed",
        }

    if application.get("review_submitted", False):
        raise HTTPException(
            status_code=400,
            detail="This application has already been reviewed",
        )

    application_repo.update(
        application_id,
        {
            "work_status": "completed",
            "work_completed_at": utc_now(),
        },
    )

    return {
        "message": "Work marked as completed successfully",
        "work_status": "completed",
    }


@router.post("/jobs/{job_id}/applications/{application_id}/review")
def review_worker(
    job_id: str,
    application_id: str,
    review_data: WorkerReviewCreate,
    employer: dict[str, Any] = Depends(get_current_employer),
    job_repo: Any = Depends(get_job_repository),
    application_repo: Any = Depends(get_application_repository),
    user_repo: Any = Depends(get_user_repository),
):
    _, application = get_owned_hired_application(
        job_id, application_id, employer, job_repo, application_repo
    )

    if application.get("work_status") != "completed":
        raise HTTPException(
            status_code=400,
            detail="Mark the work as completed before submitting a review",
        )

    if application.get("review_submitted", False):
        raise HTTPException(
            status_code=409,
            detail="You have already reviewed this worker for this job",
        )

    worker_id = application.get("worker_id")

    if not worker_id:
        raise HTTPException(
            status_code=400,
            detail="No worker is linked to this application",
        )

    worker_result = user_repo.get_by_id(worker_id)

    if not worker_result:
        raise HTTPException(status_code=404, detail="Worker not found")

    _, worker = worker_result

    if worker.get("role") != "worker":
        raise HTTPException(
            status_code=400,
            detail="The selected account is not a worker",
        )

    old_count = int(worker.get("review_count", 0) or 0)
    old_rating = float(worker.get("rating", 0) or 0)

    new_count = old_count + 1
    new_average = round(
        ((old_rating * old_count) + review_data.rating) / new_count,
        2,
    )

    review_text = (review_data.review or "").strip() or None
    reviewed_at = utc_now()

    # Save the review to the application first so it cannot be
    # submitted again through the normal endpoint.
    application_repo.update(
        application_id,
        {
            "review_submitted": True,
            "worker_rating": review_data.rating,
            "worker_review": review_text,
            "reviewed_at": reviewed_at,
        },
    )

    try:
        user_repo.update_user(
            worker_id,
            {
                "rating": new_average,
                "review_count": new_count,
            },
        )
    except Exception as exc:
        # Avoid returning a misleading success if the worker
        # profile could not be updated.
        raise HTTPException(
            status_code=500,
            detail=(
                "The review was saved, but the worker's average rating "
                "could not be updated. Please contact support."
            ),
        ) from exc

    return {
        "message": "Worker review submitted successfully",
        "rating": new_average,
        "review_count": new_count,
    }
