"""Search current open JobConnect jobs without a fixed list of occupations."""
import re
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from app.routers.worker_jobs import get_job_service
from app.services.job_service import JobService

router = APIRouter(prefix="/assistant", tags=["Worker Assistant"])

class MatchRequest(BaseModel):
    message: str = Field(min_length=2, max_length=500)
    language: str = "en"
    province: str | None = Field(default=None, max_length=100)
    skills: list[str] = Field(default_factory=list, max_length=20)

# These are location aliases, not allowed job categories.
LOCATIONS = {
    "cosmo city": ("cosmo city", "cosmo"),
    "johannesburg": ("johannesburg", "joburg", "jozi", "jhb"),
    "pretoria": ("pretoria", "tshwane"),
    "benoni": ("benoni",), "sandton": ("sandton",),
    "boksburg": ("boksburg",), "germiston": ("germiston",),
    "randburg": ("randburg",), "soweto": ("soweto",),
    "midrand": ("midrand",), "roodepoort": ("roodepoort",),
    "cape town": ("cape town",), "durban": ("durban",),
}
JHB_NEARBY = {"johannesburg", "benoni", "sandton", "boksburg", "germiston", "randburg", "soweto", "midrand", "roodepoort", "cosmo city"}
STOP = set("find looking for jobs job work working need wanted want please me i am a an the in at around near with someone household domestic available any do you have to of as and my show search seeking opportunities opportunity position positions vacancy vacancies".split())


def words(text):
    return re.findall(r"[^\W_]+", str(text or "").casefold(), flags=re.UNICODE)


def stem(word):
    """Lightweight English suffix handling; does not restrict possible occupations."""
    if len(word) > 5 and word.endswith("ies"):
        return word[:-3] + "y"
    if len(word) > 6 and word.endswith("ing"):
        base = word[:-3]
        if len(base) > 2 and base[-1] == base[-2]:
            base = base[:-1]
        return base
    if len(word) > 5 and word.endswith("ers"):
        return word[:-3]
    if len(word) > 4 and word.endswith("er"):
        return word[:-2]
    if len(word) > 4 and word.endswith("ed"):
        return word[:-2]
    if len(word) > 4 and word.endswith("s") and not word.endswith("ss"):
        return word[:-1]
    return word


def normalized(text):
    return {stem(word) for word in words(text) if word not in STOP and len(word) > 1}


def has_phrase(text, phrase):
    return bool(re.search(r"(?<!\w)" + re.escape(phrase) + r"(?!\w)", str(text or "").casefold()))


def location_in_query(text):
    for name, aliases in LOCATIONS.items():
        if any(has_phrase(text, alias) for alias in aliases):
            return name
    return None


def area_matches(requested, job_location):
    if not requested:
        return True
    if requested == "johannesburg":
        return any(any(has_phrase(job_location, alias) for alias in LOCATIONS[area]) for area in JHB_NEARBY)
    return any(has_phrase(job_location, alias) for alias in LOCATIONS[requested])


def search_terms(message, skills, province):
    text = message
    # Remove all recognised locations before comparing occupation words.
    for aliases in LOCATIONS.values():
        for alias in sorted(aliases, key=len, reverse=True):
            text = re.sub(r"(?<!\w)" + re.escape(alias) + r"(?!\w)", " ", text, flags=re.IGNORECASE)
    if province:
        text = re.sub(re.escape(province), " ", text, flags=re.IGNORECASE)
    terms = normalized(text + " " + " ".join(skills))
    return terms - {"experience", "no", "without", "required", "entry", "level"}


@router.post("/match")
def match_jobs(payload: MatchRequest, service: JobService = Depends(get_job_service)):
    if payload.language != "en":
        return {"language": "en", "jobs": [], "reply": "Please select English.", "method": "current_open_jobs"}

    area = location_in_query(payload.message)
    query = search_terms(payload.message, payload.skills, payload.province)
    if not query:
        return {"language": "en", "jobs": [], "reply": "What type of job are you looking for?", "method": "current_open_jobs"}

    results = []
    # This is the existing repository-backed list of currently open, non-expired jobs.
    for job in service.list_open_jobs():
        data = job.model_dump(mode="json")
        if payload.province and payload.province.casefold() != str(data.get("province") or "").casefold():
            continue
        if not area_matches(area, data.get("location")):
            continue
        title = normalized(data.get("title"))
        category = normalized(data.get("category"))
        required_skills = normalized(" ".join(map(str, data.get("required_skills") or [])))
        description = normalized(data.get("description"))
        score = 6 * len(query & title) + 5 * len(query & category) + 4 * len(query & required_skills) + len(query & description)
        if score > 0:
            results.append((score, data))

    results.sort(key=lambda item: (-item[0], str(item[1].get("id", ""))))
    matches = [data for _, data in results[:10]]
    return {
        "language": "en", "jobs": matches,
        "reply": ("Here are matching jobs currently open on JobConnect. Check the location and requirements before applying."
                  if matches else "No matching open jobs were found on JobConnect. Try another job type or area."),
        "method": "current_open_jobs",
    }
