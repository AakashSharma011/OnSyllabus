import uuid
from pydantic import BaseModel


class ResourceOut(BaseModel):
    id: uuid.UUID
    type: str
    title: str
    url: str
    youtube_video_id: str | None = None

    class Config:
        from_attributes = True