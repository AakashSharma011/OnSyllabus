from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.college import College
from app.schemas.college import CollegeOut

router = APIRouter()


@router.get("/", response_model=list[CollegeOut])
def list_colleges(db: Session = Depends(get_db)):
    return db.query(College).all()