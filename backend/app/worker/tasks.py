import asyncio
import subprocess
import os
from sqlalchemy.future import select
from app.core.celery_app import celery_app
from app.models.repository import Repository, RepositoryStatus
from app.db.session import AsyncSessionLocal

async def update_status(repo_id, status, local_path=None):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Repository).where(Repository.id == repo_id))
        repo = result.scalars().first()
        if repo:
            repo.status = status
            if local_path:
                repo.local_path = local_path
            await session.commit()

@celery_app.task
def clone_repository(repo_id, url):
    """
    Background task to clone a repository.
    Strictly uses synchronous subprocess for git (blocking) 
    and asyncio.run for DB updates.
    """
    # 1. Update to CLONING
    try:
        asyncio.run(update_status(repo_id, RepositoryStatus.CLONING))
    except Exception as e:
        print(f"Failed to update status to CLONING: {e}")
        return # Cannot proceed if DB is down

    try:
        # 2. Clone
        # We clone into /app/repos/{repo_id}
        # Ideally this should be a volume shared or persistent path
        target_dir = f"/app/repos/{repo_id}"
        
        # Ensure parent dir exists
        os.makedirs("/app/repos", exist_ok=True)
        
        # Check if dir exists, if so, maybe remove or pull? For now, simplistic clone
        if os.path.exists(target_dir):
            import shutil
            shutil.rmtree(target_dir)

        # Run git clone
        # git clone <url> <target_dir>
        subprocess.check_call(["git", "clone", url, target_dir])
        
        # 3. Basic Analysis
        file_count = 0
        extensions = {}
        for root, dirs, files in os.walk(target_dir):
            if ".git" in root:
                continue
            for file in files:
                file_count += 1
                ext = os.path.splitext(file)[1].lower()
                extensions[ext] = extensions.get(ext, 0) + 1
        
        analysis_summary = f"Files: {file_count}, Languages: {extensions}"
        print(f"Analysis for {repo_id}: {analysis_summary}")

        # 4. Update to COMPLETED
        # We could store analysis_summary in a new column, but for now just logging it.
        asyncio.run(update_status(repo_id, RepositoryStatus.COMPLETED, local_path=target_dir))
        return f"Successfully cloned {url} to {target_dir}. {analysis_summary}"

    except Exception as e:
        print(f"Error cloning repository {url}: {e}")
        asyncio.run(update_status(repo_id, RepositoryStatus.FAILED))
        return f"Failed to clone: {e}"

@celery_app.task
def test_task(word: str):
    import time
    time.sleep(5)
    return f"Processed: {word}"
