from fastapi import APIRouter
from app.api.endpoints import health, auth, ingestion, internships

api_router = APIRouter()
api_router.include_router(health.router, prefix="/system", tags=["System"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(ingestion.router, prefix="/data", tags=["Ingestion"])
api_router.include_router(internships.router, prefix="/internships", tags=["Internships"])

