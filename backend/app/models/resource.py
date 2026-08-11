import uuid

from sqlalchemy import Column, String, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class Resource(Base):
    __tablename__ = "resources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    unit_id = Column(UUID(as_uuid=True), ForeignKey("units.id"), nullable=False)
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    url = Column(String, nullable=False)
    youtube_video_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ClickEvent(Base):
    __tablename__ = "click_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resource_id = Column(UUID(as_uuid=True), ForeignKey("resources.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    clicked_at = Column(DateTime(timezone=True), server_default=func.now())