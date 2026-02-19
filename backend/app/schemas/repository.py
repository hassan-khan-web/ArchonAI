from pydantic import BaseModel, HttpUrl, UUID4
from datetime import datetime
from enum import Enum
from typing import Optional

class RepositoryStatus(str, Enum):
    PENDING = "pending"
    CLONING = "cloning"
    COMPLETED = "completed"
    FAILED = "failed"

class RepositoryBase(BaseModel):
    url: HttpUrl

class RepositoryCreate(RepositoryBase):
    pass

class RepositoryUpdate(BaseModel):
    status: Optional[str] = None
    local_path: Optional[str] = None
    name: Optional[str] = None

class RepositoryResponse(RepositoryBase):
    id: UUID4
    name: Optional[str] = None
    status: RepositoryStatus
    local_path: Optional[str] = None
    created_at: datetime
    # Return URL as string for easier serialization
    url: str 

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj):
        # Ensure URL is converted to string if it's not already
        if hasattr(obj, 'url'):
            obj.url = str(obj.url)
        return super().from_orm(obj)
