from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.repository import Repository, RepositoryStatus
from app.schemas.repository import RepositoryCreate, RepositoryResponse
from app.worker.tasks import clone_repository

router = APIRouter()

@router.post("/", response_model=RepositoryResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_repository(
    repo_in: RepositoryCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Submit a repository for ingestion.
    Creates a database record and triggers a background Celery task to clone it.
    """
    # Check if exists
    result = await db.execute(select(Repository).where(Repository.url == str(repo_in.url)))
    existing = result.scalars().first()
    if existing:
        return existing

    # Create new repo record
    repo = Repository(
        url=str(repo_in.url),
        status=RepositoryStatus.PENDING
    )
    db.add(repo)
    await db.commit()
    await db.refresh(repo)

    # Trigger background task
    # We pass ID and URL as simple types (UUID -> str if needed, but Celery handles UUID usually)
    # Safest to pass string for UUID
    clone_repository.delay(str(repo.id), str(repo.url))

    return repo

@router.get("/", response_model=List[RepositoryResponse])
async def read_repositories(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    List all repositories.
    """
    result = await db.execute(select(Repository).offset(skip).limit(limit))
    repos = result.scalars().all()
    return repos

@router.get("/{repo_id}", response_model=RepositoryResponse)
async def read_repository(
    repo_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific repository by ID.
    """
    result = await db.execute(select(Repository).where(Repository.id == repo_id))
    repo = result.scalars().first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    return repo
