import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_admin_user
from app.models.unit import Unit
from app.models.user import User
from app.schemas.unit import UnitOut, UnitCreate
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


@router.post("/", response_model=UnitOut)
def create_unit(payload: UnitCreate, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    unit = Unit(name=payload.name, order_index=payload.order_index, subject_id=payload.subject_id)
    db.add(unit)
    db.commit()
    db.refresh(unit)
    delete_cache(f"units:{payload.subject_id}")
    return unit