from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.repository import Repository, RepositoryStatus
from app.schemas.repository import RepositoryCreate, RepositoryResponse
from app.worker.tasks import clone_repository
import os
import uuid
import zipfile
from fastapi import UploadFile, File
import shutil

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
    repo = result.scalars().first()
    
    if repo:
        # If it exists, reset status and re-trigger
        repo.status = RepositoryStatus.PENDING
        await db.commit()
    else:
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
@router.post("/upload", response_model=RepositoryResponse)
async def upload_repository(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a ZIP file of a repository for analysis.
    """
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only ZIP files are supported")
    
    # Create a unique ID for this local repo
    repo_id = uuid.uuid4()
    upload_dir = os.path.join("repos", str(repo_id))
    os.makedirs(upload_dir, exist_ok=True)
    
    zip_path = os.path.join("repos", f"{repo_id}.zip")
    
    # Save the upload
    with open(zip_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Extract the ZIP
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(upload_dir)
    except Exception as e:
        shutil.rmtree(upload_dir)
        os.remove(zip_path)
        raise HTTPException(status_code=400, detail=f"Invalid ZIP file: {str(e)}")
    
    # Clean up the ZIP file itself
    os.remove(zip_path)

    # Create record
    repo = Repository(
        id=repo_id,
        url=f"local://{file.filename}",
        name=file.filename.replace(".zip", ""),
        status=RepositoryStatus.PENDING,
        local_path=upload_dir
    )
    db.add(repo)
    await db.commit()
    await db.refresh(repo)

    # We don't need to clone, so we trigger analysis directly?
    # Or reuse the clone task but skip cloning?
    # For now, let's assume we need a task to trigger analysis
    from app.worker.tasks import analyze_repo_task
    analyze_repo_task.delay(str(repo.id), upload_dir)

    return repo
