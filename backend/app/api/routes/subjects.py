import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_admin_user
from app.models.subject import Subject
from app.models.user import User
from app.schemas.subject import SubjectOut, SubjectCreate
from app.services.cache_service import get_cache, set_cache, delete_cache

router = APIRouter()


@router.get("/", response_model=list[SubjectOut])
def list_subjects(branch_id: str, db: Session = Depends(get_db)):
    cache_key = f"subjects:{branch_id}"
    cached = get_cache(cache_key)
    if cached:
        return json.loads(cached)

    subjects = db.query(Subject).filter(Subject.branch_id == branch_id).all()
    result = [SubjectOut.model_validate(s).model_dump(mode="json") for s in subjects]
    set_cache(cache_key, json.dumps(result), expire_seconds=3600)
    return result


@router.post("/", response_model=SubjectOut)
def create_subject(payload: SubjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    subject = Subject(name=payload.name, semester=payload.semester, branch_id=payload.branch_id)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    delete_cache(f"subjects:{payload.branch_id}")
    return subject