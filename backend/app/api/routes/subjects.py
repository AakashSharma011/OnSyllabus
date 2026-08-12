from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.subject import Subject
from app.schemas.subject import SubjectOut

router = APIRouter()


@router.get("/", response_model=list[SubjectOut])
def list_subjects(branch_id: str, db: Session = Depends(get_db)):
    return db.query(Subject).filter(Subject.branch_id == branch_id).all()