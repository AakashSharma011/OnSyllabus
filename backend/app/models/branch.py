import uuid

from sqlalchemy import Column, String , ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base

class Branch(Base):
    __tablename__ = "branches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    college_id = Column(UUID(as_uuid=True), ForeignKey("colleges.id"), nullable=False)
    name = Column(String, nullable=False)
    