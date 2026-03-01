from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import os
import tempfile
import io

from app.db.session import get_db
from app.models.repository import Repository
from app.core.reporter import ArchonReporter

router = APIRouter()
reporter = ArchonReporter()

@router.get("/{repo_id}/markdown")
async def download_markdown(repo_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Repository).where(Repository.id == repo_id))
    repo = result.scalars().first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    md_content = reporter.to_markdown(repo.__dict__)
    
    return StreamingResponse(
        io.BytesIO(md_content.encode()),
        media_type="text/markdown",
        headers={
            "Content-Disposition": f"attachment; filename=archon_audit_{repo_id}.md"
        }
    )

@router.get("/{repo_id}/pdf")
async def download_pdf(repo_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Repository).where(Repository.id == repo_id))
    repo = result.scalars().first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Generate PDF in a temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp_path = tmp.name
    
    try:
        reporter.to_pdf(repo.__dict__, tmp_path)
        return FileResponse(
            tmp_path, 
            media_type="application/pdf",
            filename=f"archon_audit_{repo_id}.pdf"
        )
    except Exception as e:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")
