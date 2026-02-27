from fastapi import APIRouter
from app.api.endpoints import repositories, github, auth

api_router = APIRouter()

api_router.include_router(repositories.router, prefix="/repositories", tags=["repositories"])
api_router.include_router(github.router, prefix="/github", tags=["github"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
