import uuid
import enum
from sqlalchemy import Column, String, Enum, DateTime, func, JSON, Integer
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base

class RepositoryStatus(str, enum.Enum):
    PENDING = "pending"
    CLONING = "cloning"
    COMPLETED = "completed"
    FAILED = "failed"

class Repository(Base):
    __tablename__ = "repositories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    url = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    status = Column(Enum(RepositoryStatus), default=RepositoryStatus.PENDING, nullable=False)
    local_path = Column(String, nullable=True)
    analysis_results = Column(JSON, nullable=True)
    overall_score = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
