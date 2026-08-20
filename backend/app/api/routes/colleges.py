from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_admin_user
from app.models.college import College
from app.models.branch import Branch
from app.models.subject import Subject
from app.models.unit import Unit
from app.models.resource import Resource, ClickEvent
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


@router.delete("/{college_id}")
def delete_college(college_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    college = db.query(College).filter(College.id == college_id).first()
    if college is None:
        raise HTTPException(status_code=404, detail="College not found")

    branch_ids = [b.id for b in db.query(Branch).filter(Branch.college_id == college_id).all()]
    subject_ids = [s.id for s in db.query(Subject).filter(Subject.branch_id.in_(branch_ids)).all()] if branch_ids else []
    unit_ids = [u.id for u in db.query(Unit).filter(Unit.subject_id.in_(subject_ids)).all()] if subject_ids else []
    resource_ids = [r.id for r in db.query(Resource).filter(Resource.unit_id.in_(unit_ids)).all()] if unit_ids else []

    if resource_ids:
        db.query(ClickEvent).filter(ClickEvent.resource_id.in_(resource_ids)).delete(synchronize_session=False)
        db.query(Resource).filter(Resource.id.in_(resource_ids)).delete(synchronize_session=False)
    if unit_ids:
        db.query(Unit).filter(Unit.id.in_(unit_ids)).delete(synchronize_session=False)
    if subject_ids:
        db.query(Subject).filter(Subject.id.in_(subject_ids)).delete(synchronize_session=False)
    if branch_ids:
        db.query(Branch).filter(Branch.id.in_(branch_ids)).delete(synchronize_session=False)

    db.delete(college)
    db.commit()
    return {"message": "College and all related content deleted"}