from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user, get_admin_user
from app.models.resource import Resource, ClickEvent
from app.models.user import User
from app.schemas.resource import ResourceOut, ResourceCreate
from app.utils.youtube import extract_video_id
from fastapi import UploadFile, File, Form
from app.services.storage_service import upload_file

router = APIRouter()


@router.get("/", response_model=list[ResourceOut])
def list_resources(unit_id: str, db: Session = Depends(get_db)):
    return db.query(Resource).filter(Resource.unit_id == unit_id).all()


@router.post("/", response_model=ResourceOut)
def create_resource(payload: ResourceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    video_id = extract_video_id(payload.url) if payload.type == "playlist" else None
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


@router.delete("/{resource_id}")
def delete_resource(resource_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if resource is None:
        raise HTTPException(status_code=404, detail="Resource not found")
    db.query(ClickEvent).filter(ClickEvent.resource_id == resource_id).delete(synchronize_session=False)
    db.delete(resource)
    db.commit()
    return {"message": "Resource deleted"}


@router.post("/{resource_id}/click")
def log_click(resource_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if resource is None:
        raise HTTPException(status_code=404, detail="Resource not found")

    event = ClickEvent(resource_id=resource_id, user_id=current_user.id)
    db.add(event)
    db.commit()
    return {"message": "logged"}

@router.post("/upload-file")
async def upload_resource_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_admin_user),
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    contents = await file.read()
    if len(contents) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 20MB)")

    url = upload_file(contents, file.filename, file.content_type)
    return {"url": url}