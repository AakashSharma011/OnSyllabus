from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user, get_admin_user
from app.models.resource import Resource, ClickEvent
from app.models.user import User
from app.schemas.resource import ResourceOut, ResourceCreate
from app.utils.youtube import extract_video_id

router = APIRouter()


@router.get("/", response_model=list[ResourceOut])
def list_resources(unit_id: str, db: Session = Depends(get_db)):
    return db.query(Resource).filter(Resource.unit_id == unit_id).all()


@router.post("/", response_model=ResourceOut)
def create_resource(payload: ResourceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    video_id = extract_video_id(payload.url) if payload.type == "video" else None
    resource = Resource(
        unit_id=payload.unit_id,
        type=payload.type,
        title=payload.title,
        url=payload.url,
        youtube_video_id=video_id,
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource


@router.post("/{resource_id}/click")
def log_click(resource_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if resource is None:
        raise HTTPException(status_code=404, detail="Resource not found")

    event = ClickEvent(resource_id=resource_id, user_id=current_user.id)
    db.add(event)
    db.commit()
    return {"message": "logged"}