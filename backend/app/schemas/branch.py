import uuid
from pydantic import BaseModel


class BranchOut(BaseModel):
    id: uuid.UUID
    name: str

    class Config:
        from_attributes = True