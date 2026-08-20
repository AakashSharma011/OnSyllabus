import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_admin_user
from app.models.unit import Unit
from app.models.resource import Resource, ClickEvent
from app.models.user import User
from app.schemas.unit import UnitOut, UnitCreate, UnitUpdate
from app.services.cache_service import get_cache, set_cache, delete_cache

router = APIRouter()


@router.get("/", response_model=list[UnitOut])
def list_units(subject_id: str, db: Session = Depends(get_db)):
    cache_key = f"units:{subject_id}"
    cached = get_cache(cache_key)
    if cached:
        return json.loads(cached)

    units = db.query(Unit).filter(Unit.subject_id == subject_id).order_by(Unit.order_index).all()
    result = [UnitOut.model_validate(u).model_dump(mode="json") for u in units]
    set_cache(cache_key, json.dumps(result), expire_seconds=3600)
    return result


@router.get("/{unit_id}", response_model=UnitOut)
def get_unit(unit_id: str, db: Session = Depends(get_db)):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if unit is None:
        raise HTTPException(status_code=404, detail="Unit not found")
    return unit


@router.post("/", response_model=UnitOut)
def create_unit(payload: UnitCreate, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    unit = Unit(
        name=payload.name,
        order_index=payload.order_index,
        subject_id=payload.subject_id,
        description=payload.description,
    )
    db.add(unit)
    db.commit()
    db.refresh(unit)
    delete_cache(f"units:{payload.subject_id}")
    return unit


@router.patch("/{unit_id}", response_model=UnitOut)
def update_unit(unit_id: str, payload: UnitUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if unit is None:
        raise HTTPException(status_code=404, detail="Unit not found")
    if payload.description is not None:
        unit.description = payload.description
    db.commit()
    db.refresh(unit)
    return unit


@router.delete("/{unit_id}")
def delete_unit(unit_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if unit is None:
        raise HTTPException(status_code=404, detail="Unit not found")

    resource_ids = [r.id for r in db.query(Resource).filter(Resource.unit_id == unit_id).all()]
    if resource_ids:
        db.query(ClickEvent).filter(ClickEvent.resource_id.in_(resource_ids)).delete(synchronize_session=False)
        db.query(Resource).filter(Resource.id.in_(resource_ids)).delete(synchronize_session=False)

    subject_id = unit.subject_id
    db.delete(unit)
    db.commit()
    delete_cache(f"units:{subject_id}")
    return {"message": "Unit and its resources deleted"}