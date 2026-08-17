from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_admin_user
from app.models.branch import Branch
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