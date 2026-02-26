from fastapi import APIRouter, HTTPException
import httpx
from typing import List, Dict, Any

router = APIRouter()

@router.get("/repos/{username}")
async def get_github_repos(username: str):
    """
    Fetch public repositories for a given GitHub username.
    """
    url = f"https://api.github.com/users/{username}/repos"
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "ArchonAI-Architect"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="GitHub user not found")
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Error fetching from GitHub")
            
            repos = response.json()
            # Simplify response for the frontend
            return [
                {
                    "name": repo["name"],
                    "full_name": repo["full_name"],
                    "html_url": repo["html_url"],
                    "description": repo["description"],
                    "stargazers_count": repo["stargazers_count"],
                    "language": repo["language"]
                }
                for repo in repos
            ]
        except Exception as e:
            if isinstance(e, HTTPException): raise e
            raise HTTPException(status_code=500, detail=str(e))
