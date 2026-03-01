import asyncio
import subprocess
import os
from sqlalchemy.future import select
from celery.signals import worker_process_init
from app.core.celery_app import celery_app
from app.models.repository import Repository, RepositoryStatus
from app.db.session import AsyncSessionLocal, engine
from app.core.analyzer import RepositoryAnalyzer
from celery.exceptions import SoftTimeLimitExceeded

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

async def update_status(repo_id, status, local_path=None, analysis_results=None, overall_score=0, log_message=None):
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
            if log_message:
                if repo.logs is None: repo.logs = []
                # Append log message
                new_logs = list(repo.logs)
                new_logs.append(log_message)
                repo.logs = new_logs
            await session.commit()

@celery_app.task
def clone_repository(repo_id, url, github_token=None):
    """
    Background task to clone a repository.
    Strictly uses synchronous subprocess for git (blocking) 
    and asyncio.run for DB updates.
    """
    # ... (status updates omitted for brevity)
    
    try:
        # ...
        target_dir = f"/app/repos/{repo_id}"
        
        # Clone with auth if token is present
        clone_url = url
        if github_token and "github.com" in url:
            # Inject token into URL: https://x-access-token:<token>@github.com/owner/repo
            token_url = url.replace("https://", f"https://x-access-token:{github_token}@")
            clone_url = token_url
            
        # Run git clone
        subprocess.check_call(["git", "clone", clone_url, target_dir])
        
        # 3. Enhanced Analysis with live logging
        def on_analysis_progress(msg):
            try:
                # Use the current event loop if it's already running
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    loop.create_task(update_status(repo_id, RepositoryStatus.CLONING, log_message=msg))
                else:
                    asyncio.run(update_status(repo_id, RepositoryStatus.CLONING, log_message=msg))
            except Exception as e:
                # Fallback: create a new loop if get_event_loop fails
                try:
                    new_loop = asyncio.new_event_loop()
                    new_loop.run_until_complete(update_status(repo_id, RepositoryStatus.CLONING, log_message=msg))
                    new_loop.close()
                except:
                    print(f"Failed to log progress: {e}")

        asyncio.run(update_status(repo_id, RepositoryStatus.CLONING, log_message="System: Repository cloned. Starting analysis engine..."))
        
        analyzer = RepositoryAnalyzer(target_dir, on_progress=on_analysis_progress)
        analysis_results = asyncio.run(analyzer.analyze())
        
        print(f"Analysis for {repo_id}: Score {analysis_results.get('overall_score')}")

        # 4. Update to COMPLETED
        asyncio.run(update_status(
            repo_id, 
            RepositoryStatus.COMPLETED, 
            local_path=target_dir,
            analysis_results=analysis_results,
            overall_score=analysis_results.get("overall_score", 0),
            log_message="System: Analysis complete. All reports finalized."
        ))
        return f"Successfully analyzed {url}. Score: {analysis_results.get('overall_score')}"

    except SoftTimeLimitExceeded:
        print(f"Soft time limit exceeded for repository {url}")
        asyncio.run(update_status(
            repo_id, 
            RepositoryStatus.FAILED, 
            log_message="System: Analysis timeout. Project is too large or complex for the current processing window."
        ))
        return f"Timeout analyzing {url}"

    except Exception as e:
        print(f"Error cloning repository {url}: {e}")
        asyncio.run(update_status(repo_id, RepositoryStatus.FAILED, log_message=f"System Error: {str(e)}"))
        return f"Failed to clone: {e}"

@celery_app.task
def test_task(word: str):
    import time
    time.sleep(5)
    return f"Processed: {word}"
