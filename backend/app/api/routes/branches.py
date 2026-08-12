from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.branch import Branch
from app.schemas.branch import BranchOut

router = APIRouter()


@router.get("/", response_model=list[BranchOut])
def list_branches(college_id: str, db: Session = Depends(get_db)):
    return db.query(Branch).filter(Branch.college_id == college_id).all()