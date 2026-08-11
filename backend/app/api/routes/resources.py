from fastapi import APIRouter

from app.schemas.resource import ResourceOut

router = APIRouter()


@router.get("/", response_model=list[ResourceOut])
def list_resources(unit_id: str):
    return []


@router.post("/{resource_id}/click")
def log_click(resource_id: str):
    return {"message": "logged"}