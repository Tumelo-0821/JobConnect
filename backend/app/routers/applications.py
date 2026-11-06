from pathlib import Path
import mimetypes

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse

from app.dependencies import (
    get_current_employer,
    get_application_repository,
    get_job_repository,
    get_user_repository,
    get_notification_repository,
)
from app.repositories.memory import (
    ApplicationRepository,
    JobRepository,
    UserRepository,
)
from app.schemas.application import (
    ApplicationResponse,
    ApplicationStatusUpdate,
    ShortlistRequest,
)
from app.services.application_service import ApplicationService
from app.services.cv_extraction_service import CVExtractionService
from app.services.ats_matching_service import ATSMatchingService
from app.repositories.notification_repository import NotificationRepository

BASE_DIR = Path(__file__).resolve().parents[2]
CV_UPLOAD_DIR = BASE_DIR / "uploads" / "cvs"
DOCUMENT_UPLOAD_DIR = BASE_DIR / "uploads" / "worker_documents"

def resolve_cv_path(storage_path: str) -> Path:
    file_path = (BASE_DIR / storage_path).resolve()

    try:
        file_path.relative_to(CV_UPLOAD_DIR.resolve())
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid CV file path",
        ) from exc

    if not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV file not found",
        )

    return file_path

#router = APIRouter(prefix="/employers/jobs", tags=["Applications"])
router = APIRouter(prefix="/employers", tags=["Applications"])

def get_application_service(
    app_repo: ApplicationRepository = Depends(get_application_repository),
    job_repo: JobRepository = Depends(get_job_repository),
    user_repo: UserRepository = Depends(get_user_repository),
    notification_repo: NotificationRepository = Depends(
        get_notification_repository
    ),
) -> ApplicationService:
    return ApplicationService(
        app_repo,
        job_repo,
        user_repo,
        notification_repo,
    )

@router.get(
    "/all-applications",
    response_model=list[ApplicationResponse],
    summary="List applications for the employer",
)

def list_employer_applications(
    employer: dict = Depends(get_current_employer),
    app_service: ApplicationService = Depends(get_application_service),
) -> list[ApplicationResponse]:
    return app_service.list_employer_applications(employer["id"])

@router.get(
    "/jobs/{job_id}/applications",
    response_model=list[ApplicationResponse],
    summary="List applications for a job",
)
def list_job_applications(
    job_id: str,
    employer: dict = Depends(get_current_employer),
    app_service: ApplicationService = Depends(get_application_service),
) -> list[ApplicationResponse]:
    return app_service.list_job_applications(employer["id"], job_id)



@router.patch(
    "/jobs/{job_id}/applications/{app_id}",
    response_model=ApplicationResponse,
    summary="Update application status",
)
def update_application_status(
    job_id: str,
    app_id: str,
    payload: ApplicationStatusUpdate,
    employer: dict = Depends(get_current_employer),
    app_service: ApplicationService = Depends(get_application_service),
) -> ApplicationResponse:
    return app_service.update_application_status(employer["id"], job_id, app_id, payload)

@router.get(
    "/jobs/{job_id}/applications/{app_id}/cv",
    summary="View an applicant CV",
)
def view_application_cv(
    job_id: str,
    app_id: str,
    employer: dict = Depends(get_current_employer),
    app_service: ApplicationService = Depends(get_application_service),
):
    cv_info = app_service.get_application_cv(
        employer["id"],
        job_id,
        app_id,
    )

    file_path = (
        BASE_DIR / cv_info["cv_storage_path"]
    ).resolve()

    # Make sure the file stays inside the CV upload directory.
    try:
        file_path.relative_to(CV_UPLOAD_DIR.resolve())
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid CV file path",
        ) from exc

    if not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV file not found",
        )

    media_type, _ = mimetypes.guess_type(
        str(file_path)
    )

    return FileResponse(
        path=file_path,
        media_type=media_type or "application/octet-stream",
        filename=cv_info["cv_file_name"],
    )

@router.get(
    "/jobs/{job_id}/applications/{app_id}/documents",
    summary="List an applicant's supporting documents",
)
def list_application_documents(
    job_id: str,
    app_id: str,
    employer: dict = Depends(get_current_employer),
    app_service: ApplicationService = Depends(get_application_service),
):
    return app_service.get_application_documents(
        employer["id"],
        job_id,
        app_id,
    )

@router.get(
    "/jobs/{job_id}/applications/{app_id}/documents/{document_id}",
    summary="View or download an applicant's supporting document",
)
def view_application_document(
    job_id: str,
    app_id: str,
    document_id: str,
    employer: dict = Depends(get_current_employer),
    app_service: ApplicationService = Depends(get_application_service),
):
    documents = app_service.get_application_documents(
        employer["id"],
        job_id,
        app_id,
    )

    document_info = next(
        (
            document
            for document in documents
            if document.get("id") == document_id
        ),
        None,
    )

    if not document_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supporting document not found",
        )

    storage_path = document_info.get("storage_path")

    if not storage_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document storage path not found",
        )

    file_path = (BASE_DIR / storage_path).resolve()

    try:
        file_path.relative_to(DOCUMENT_UPLOAD_DIR.resolve())
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid supporting document path",
        ) from exc

    if not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supporting document file not found",
        )

    media_type, _ = mimetypes.guess_type(str(file_path))

    return FileResponse(
        path=file_path,
        media_type=media_type or "application/octet-stream",
        filename=document_info["document_name"],
    )

@router.get(
    "/jobs/{job_id}/applications/{app_id}/ats",
    summary="Analyse an applicant CV against a job",
)
def analyse_application_ats(
    job_id: str,
    app_id: str,
    employer: dict = Depends(get_current_employer),
    app_service: ApplicationService = Depends(get_application_service),
    job_repo: JobRepository = Depends(get_job_repository),
):
    # Verify that the employer owns the job and can access this CV.
    cv_info = app_service.get_application_cv(
        employer["id"],
        job_id,
        app_id,
    )

    # Retrieve the job requirements.
    job_result = job_repo.get_by_id(job_id)

    if not job_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    _, job_data = job_result

    # Resolve the CV path safely.
    file_path = (
        BASE_DIR / cv_info["cv_storage_path"]
    ).resolve()

    try:
        file_path.relative_to(CV_UPLOAD_DIR.resolve())
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid CV file path",
        ) from exc

    if not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV file not found",
        )

    # Extract the CV text.
    cv_text = CVExtractionService.extract_text(file_path)

    # Compare the CV against the job requirements.
    analysis = ATSMatchingService.analyse_candidate(
        cv_text,
        job_data,
    )

    # Return the results without exposing the extracted CV text.
    return {
        "application_id": app_id,
        "job_id": job_id,
        "job_title": job_data.get("title"),
        "cv_file_name": cv_info["cv_file_name"],
        "analysis": analysis,
        "message": (
            "ATS analysis completed. "
            "As  employer make the final recruitment decision."
        ),
    }

@router.post(
    "/jobs/{job_id}/applications/shortlist",
    summary="Assess and shortlist applicants using ATS",
)
def shortlist_job_applicants(
    job_id: str,
    payload: ShortlistRequest,
    employer: dict = Depends(get_current_employer),
    app_repo: ApplicationRepository = Depends(get_application_repository),
    job_repo: JobRepository = Depends(get_job_repository),
    user_repo: UserRepository = Depends(get_user_repository),
):
    # Verify that the job exists.
    job_result = job_repo.get_by_id(job_id)

    if not job_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    _, job_data = job_result

    # Verify that this employer owns the job.
    if job_data.get("employer_id") != employer["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to assess these applications",
        )

    # Retrieve every application for this job.
    applications = app_repo.list_by_job(job_id)

    assessed_candidates = []
    unassessed_candidates = []

    for app_id, app_data in applications:
        worker_id = app_data.get("worker_id")

        candidate = {
            "application_id": app_id,
            "worker_id": worker_id,
            "application_status": app_data.get("status"),
            "cv_file_name": None,
        }

        try:
            if not worker_id:
                raise ValueError("Worker information is missing.")

            worker_result = user_repo.get_by_id(worker_id)

            if not worker_result:
                raise ValueError("Worker record could not be found.")

            _, worker_data = worker_result

            candidate["worker_name"] = (
                f"{worker_data.get('first_name', '')} "
                f"{worker_data.get('last_name', '')}"
            ).strip() or None

            cv_storage_path = worker_data.get("cv_storage_path")
            cv_file_name = worker_data.get("cv_file_name")

            candidate["cv_file_name"] = cv_file_name

            if not cv_storage_path or not cv_file_name:
                raise ValueError("The applicant has not uploaded a CV.")

            file_path = resolve_cv_path(cv_storage_path)

            cv_text = CVExtractionService.extract_text(file_path)

            analysis = ATSMatchingService.analyse_candidate(
                cv_text,
                job_data,
            )

            overall_score = analysis.get("overall_score")

            result = {
                **candidate,
                "assessment_status": (
                    "assessed"
                    if overall_score is not None
                    else "not_assessed"
                ),
                "overall_score": overall_score,
                "assessment_coverage": analysis.get(
                    "assessment_coverage"
                ),
                "analysis": analysis,
            }

            if overall_score is not None:
                assessed_candidates.append(result)
            else:
                result["reason"] = (
                    "No assessable approved job requirements were available."
                )
                unassessed_candidates.append(result)

        except Exception:
            candidate["assessment_status"] = "not_assessed"
            candidate["overall_score"] = None
            candidate["assessment_coverage"] = 0
            candidate["reason"] = (
                "The CV could not be assessed. "
                "It may be missing, invalid, or unreadable."
            )
            unassessed_candidates.append(candidate)

    # Sort all assessable candidates by score, highest first.
    assessed_candidates.sort(
        key=lambda candidate: candidate["overall_score"],
        reverse=True,
    )

    # Assign rankings. Candidates with equal scores share the same rank.
    previous_score = None
    current_rank = 0

    for index, candidate in enumerate(assessed_candidates):
        score = candidate["overall_score"]

        if score != previous_score:
            current_rank = index + 1
            previous_score = score

        candidate["rank"] = current_rank

    # Select the requested number of candidates.
    if payload.limit is None:
        shortlisted = assessed_candidates.copy()

    else:
        shortlisted = assessed_candidates[:payload.limit]

        # Include everyone tied with the last selected candidate.
        if shortlisted:
            cutoff_score = shortlisted[-1]["overall_score"]

            shortlisted = [
                candidate
                for candidate in assessed_candidates
                if candidate["overall_score"] >= cutoff_score
            ]

    # Return every applicant, including those not assessed.
    all_applicants = assessed_candidates + unassessed_candidates

    return {
        "job_id": job_id,
        "job_title": job_data.get("title"),
        "total_applications": len(applications),
        "assessed_count": len(assessed_candidates),
        "not_assessed_count": len(unassessed_candidates),
        "shortlist_limit": payload.limit,
        "shortlisted_count": len(shortlisted),
        "shortlisted_candidates": shortlisted,
        "all_applicants": all_applicants,
        "message": (
            "ATS assessment completed. Rankings are recommendations only. "
            "The employer makes all final recruitment decisions. "
            "No application statuses were changed."
        ),
    }
