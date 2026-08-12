from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.resource import Resource, ClickEvent
from app.models.user import User
from app.schemas.resource import ResourceOut

router = APIRouter()


@router.get("/", response_model=list[ResourceOut])
def list_resources(unit_id: str, db: Session = Depends(get_db)):
    return db.query(Resource).filter(Resource.unit_id == unit_id).all()


@router.post("/{resource_id}/click")
def log_click(
    resource_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if resource is None:
        raise HTTPException(status_code=404, detail="Resource not found")

    event = ClickEvent(resource_id=resource_id, user_id=current_user.id)
    db.add(event)
    db.commit()
    return {"message": "logged"}