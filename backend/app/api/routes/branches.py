from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_admin_user
from app.models.branch import Branch
from app.models.subject import Subject
from app.models.unit import Unit
from app.models.resource import Resource, ClickEvent
from app.models.user import User
from app.schemas.branch import BranchOut, BranchCreate

router = APIRouter()


@router.get("/", response_model=list[BranchOut])
def list_branches(college_id: str, db: Session = Depends(get_db)):
    return db.query(Branch).filter(Branch.college_id == college_id).all()


@router.post("/", response_model=BranchOut)
def create_branch(payload: BranchCreate, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    branch = Branch(name=payload.name, college_id=payload.college_id)
    db.add(branch)
    db.commit()
    db.refresh(branch)
    return branch


@router.delete("/{branch_id}")
def delete_branch(branch_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if branch is None:
        raise HTTPException(status_code=404, detail="Branch not found")

    subject_ids = [s.id for s in db.query(Subject).filter(Subject.branch_id == branch_id).all()]
    unit_ids = [u.id for u in db.query(Unit).filter(Unit.subject_id.in_(subject_ids)).all()] if subject_ids else []
    resource_ids = [r.id for r in db.query(Resource).filter(Resource.unit_id.in_(unit_ids)).all()] if unit_ids else []

    if resource_ids:
        db.query(ClickEvent).filter(ClickEvent.resource_id.in_(resource_ids)).delete(synchronize_session=False)
        db.query(Resource).filter(Resource.id.in_(resource_ids)).delete(synchronize_session=False)
    if unit_ids:
        db.query(Unit).filter(Unit.id.in_(unit_ids)).delete(synchronize_session=False)
    if subject_ids:
        db.query(Subject).filter(Subject.id.in_(subject_ids)).delete(synchronize_session=False)

    db.delete(branch)
    db.commit()
    return {"message": "Branch and all related content deleted"}