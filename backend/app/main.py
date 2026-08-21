from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_firebase
from app.routers import applications, auth, employer_stats, employers, jobs, worker_jobs, workers


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_firebase()
    yield


app = FastAPI(
    title=settings.app_name,
    description="JobConnect SA backend API (Firebase Firestore)",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"


app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(employers.router, prefix=API_PREFIX)
app.include_router(jobs.router, prefix=API_PREFIX)
app.include_router(workers.router, prefix=API_PREFIX)
app.include_router(worker_jobs.router, prefix=API_PREFIX)
app.include_router(applications.router, prefix=API_PREFIX)
app.include_router(employer_stats.router, prefix=API_PREFIX)


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    return {"status": "ok", "environment": settings.app_env}
