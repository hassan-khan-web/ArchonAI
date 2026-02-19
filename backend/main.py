from fastapi import FastAPI
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to DB, etc.
    yield
    # Shutdown: Disconnect, etc.

app = FastAPI(title="ArchonAI API", version="0.1.0", lifespan=lifespan)

@app.get("/")
async def root():
    return {"message": "ArchonAI API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}
