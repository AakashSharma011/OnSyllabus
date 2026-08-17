from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_admin_user
from app.models.college import College
from app.models.user import User
from app.schemas.college import CollegeOut, CollegeCreate

router = APIRouter()


@router.get("/", response_model=list[CollegeOut])
def list_colleges(db: Session = Depends(get_db)):
    return db.query(College).all()


@router.post("/", response_model=CollegeOut)
def create_college(payload: CollegeCreate, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    college = College(name=payload.name, university=payload.university)
    db.add(college)
    db.commit()
    db.refresh(college)
    return college