import uuid
from pydantic import BaseModel


class BranchOut(BaseModel):
    id: uuid.UUID
    name: str

    class Config:
        from_attributes = True

class BranchCreate(BaseModel):
    name: str
    college_id: uuid.UUID