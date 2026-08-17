import uuid

from sqlalchemy import Column, String, DateTime, func,Boolean
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    college_id = Column(UUID(as_uuid=True), nullable=True)
    branch_id = Column(UUID(as_uuid=True), nullable=True)
    is_verified = Column(String, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_admin = Column(Boolean, default=False)