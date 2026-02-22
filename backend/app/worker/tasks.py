import asyncio
import subprocess
import os
from sqlalchemy.future import select
from celery.signals import worker_process_init
from app.core.celery_app import celery_app
from app.models.repository import Repository, RepositoryStatus
from app.db.session import AsyncSessionLocal, engine
from app.core.analyzer import RepositoryAnalyzer

@worker_process_init.connect
def init_worker(**kwargs):
    """
    Called when a new worker process starts (prefork).
    We dispose of the engine inherited from the parent process
    to ensure each child starts with its own fresh pool.
    """
    import asyncio
    try:
        # Use sync dispose for the engine pool if possible, but for asyncpg/asyncio
        # it's safer to just let the pool be recreated on first use in the child.
        # SQLAlchemy's engine.dispose() is actually async for AsyncEngine.
        # Since this signal is sync, we use a small bridge.
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.ensure_future(engine.dispose())
        else:
            asyncio.run(engine.dispose())
    except Exception as e:
        print(f"Error disposing engine in worker init: {e}")

async def update_status(repo_id, status, local_path=None, analysis_results=None, overall_score=0):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Repository).where(Repository.id == repo_id))
        repo = result.scalars().first()
        if repo:
            repo.status = status
            if local_path:
                repo.local_path = local_path
            if analysis_results:
                repo.analysis_results = analysis_results
                repo.overall_score = overall_score
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
        
        # 3. Enhanced Analysis
        analyzer = RepositoryAnalyzer(target_dir)
        analysis_results = analyzer.analyze()
        
        print(f"Analysis for {repo_id}: Score {analysis_results.get('overall_score')}")

        # 4. Update to COMPLETED
        asyncio.run(update_status(
            repo_id, 
            RepositoryStatus.COMPLETED, 
            local_path=target_dir,
            analysis_results=analysis_results,
            overall_score=analysis_results.get("overall_score", 0)
        ))
        return f"Successfully analyzed {url}. Score: {analysis_results.get('overall_score')}"

    except Exception as e:
        print(f"Error cloning repository {url}: {e}")
        asyncio.run(update_status(repo_id, RepositoryStatus.FAILED))
        return f"Failed to clone: {e}"

@celery_app.task
def test_task(word: str):
    import time
    time.sleep(5)
    return f"Processed: {word}"
