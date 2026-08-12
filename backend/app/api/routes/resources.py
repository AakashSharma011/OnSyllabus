from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.resource import Resource, ClickEvent
from app.schemas.resource import ResourceOut

router = APIRouter()


@router.get("/", response_model=list[ResourceOut])
def list_resources(unit_id: str, db: Session = Depends(get_db)):
    return db.query(Resource).filter(Resource.unit_id == unit_id).all()


@router.post("/{resource_id}/click")
def log_click(resource_id: str, db: Session = Depends(get_db)):
    event = ClickEvent(resource_id=resource_id)
    db.add(event)
    db.commit()
    return {"message": "logged"}