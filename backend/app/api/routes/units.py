from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.unit import Unit
from app.schemas.unit import UnitOut

router = APIRouter()


@router.get("/", response_model=list[UnitOut])
def list_units(subject_id: str, db: Session = Depends(get_db)):
    return db.query(Unit).filter(Unit.subject_id == subject_id).order_by(Unit.order_index).all()