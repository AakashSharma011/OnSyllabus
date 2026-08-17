import uuid
from pydantic import BaseModel


class CollegeOut(BaseModel):
    id: uuid.UUID
    name: str
    university: str

    class Config:
        from_attributes = True

class CollegeCreate(BaseModel):
    name: str
    university: str