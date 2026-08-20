import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import distinct

from app.core.database import get_db
from app.api.deps import get_admin_user
from app.models.subject import Subject
from app.models.unit import Unit
from app.models.resource import Resource, ClickEvent
from app.models.user import User
from app.schemas.subject import SubjectOut, SubjectCreate
from app.services.cache_service import get_cache, set_cache, delete_cache

router = APIRouter()


@router.get("/semesters")
def list_semesters(branch_id: str, db: Session = Depends(get_db)):
    rows = db.query(distinct(Subject.semester)).filter(Subject.branch_id == branch_id).order_by(Subject.semester).all()
    return [r[0] for r in rows]


@router.get("/", response_model=list[SubjectOut])
def list_subjects(branch_id: str, semester: int | None = None, db: Session = Depends(get_db)):
    cache_key = f"subjects:{branch_id}:{semester or 'all'}"
    cached = get_cache(cache_key)
    if cached:
        return json.loads(cached)

    query = db.query(Subject).filter(Subject.branch_id == branch_id)
    if semester is not None:
        query = query.filter(Subject.semester == semester)
    subjects = query.all()
    result = [SubjectOut.model_validate(s).model_dump(mode="json") for s in subjects]
    set_cache(cache_key, json.dumps(result), expire_seconds=3600)
    return result


@router.post("/", response_model=SubjectOut)
def create_subject(payload: SubjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    subject = Subject(name=payload.name, semester=payload.semester, branch_id=payload.branch_id)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    delete_cache(f"subjects:{payload.branch_id}:all")
    delete_cache(f"subjects:{payload.branch_id}:{payload.semester}")
    return subject


@router.delete("/{subject_id}")
def delete_subject(subject_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if subject is None:
        raise HTTPException(status_code=404, detail="Subject not found")

    unit_ids = [u.id for u in db.query(Unit).filter(Unit.subject_id == subject_id).all()]
    resource_ids = [r.id for r in db.query(Resource).filter(Resource.unit_id.in_(unit_ids)).all()] if unit_ids else []

    if resource_ids:
        db.query(ClickEvent).filter(ClickEvent.resource_id.in_(resource_ids)).delete(synchronize_session=False)
        db.query(Resource).filter(Resource.id.in_(resource_ids)).delete(synchronize_session=False)
    if unit_ids:
        db.query(Unit).filter(Unit.id.in_(unit_ids)).delete(synchronize_session=False)

    branch_id, semester = subject.branch_id, subject.semester
    db.delete(subject)
    db.commit()

    delete_cache(f"subjects:{branch_id}:all")
    delete_cache(f"subjects:{branch_id}:{semester}")
    return {"message": "Subject and all related content deleted"}