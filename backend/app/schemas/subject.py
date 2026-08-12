import uuid
from pydantic import BaseModel


class SubjectOut(BaseModel):
    id: uuid.UUID
    name: str
    semester: int

    class Config:
        from_attributes = True