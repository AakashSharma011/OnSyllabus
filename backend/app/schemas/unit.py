import uuid
from pydantic import BaseModel


class UnitOut(BaseModel):
    id: uuid.UUID
    name: str
    order_index: int

    class Config:
        from_attributes = True



class UnitCreate(BaseModel):
    name: str
    order_index: int
    subject_id: uuid.UUID