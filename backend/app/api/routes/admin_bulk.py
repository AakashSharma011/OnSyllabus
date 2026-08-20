from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_admin_user
from app.models.user import User
from app.models.college import College
from app.models.branch import Branch
from app.models.semester import Semester
from app.models.subject import Subject
from app.models.unit import Unit
from app.models.resource import Resource
from app.schemas.admin_bulk import BulkStructureRequest, BulkResourceRequest
from app.utils.youtube import extract_video_id
from app.services.cache_service import delete_cache

router = APIRouter()


@router.post("/bulk-structure")
def bulk_structure(payload: BulkStructureRequest, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    summary = {
        "colleges": {"created": 0, "reused": 0},
        "branches": {"created": 0, "reused": 0},
        "semesters": {"created": 0, "reused": 0},
        "subjects": {"created": 0, "reused": 0},
        "units": {"created": 0, "reused": 0},
    }

    college_ids = list(payload.college_ids)
    if payload.new_college and payload.new_college.name.strip():
        name = payload.new_college.name.strip()
        existing = db.query(College).filter(College.name.ilike(name)).first()
        if existing:
            college_ids.append(existing.id)
            summary["colleges"]["reused"] += 1
        else:
            college = College(name=name, university=payload.new_college.university.strip())
            db.add(college)
            db.flush()
            college_ids.append(college.id)
            summary["colleges"]["created"] += 1
    college_ids = list(dict.fromkeys(college_ids))

    branch_ids = list(payload.branch_ids)
    branch_names = [n.strip() for n in payload.new_branch_names if n.strip()]
    if branch_names and college_ids:
        for college_id in college_ids:
            for name in branch_names:
                existing = db.query(Branch).filter(Branch.college_id == college_id, Branch.name.ilike(name)).first()
                if existing:
                    branch_ids.append(existing.id)
                    summary["branches"]["reused"] += 1
                else:
                    branch = Branch(name=name, college_id=college_id)
                    db.add(branch)
                    db.flush()
                    branch_ids.append(branch.id)
                    summary["branches"]["created"] += 1
    branch_ids = list(dict.fromkeys(branch_ids))

    if payload.semesters and branch_ids:
        for branch_id in branch_ids:
            for number in payload.semesters:
                existing = db.query(Semester).filter(Semester.branch_id == branch_id, Semester.number == number).first()
                if existing:
                    summary["semesters"]["reused"] += 1
                else:
                    db.add(Semester(branch_id=branch_id, number=number))
                    summary["semesters"]["created"] += 1

    subject_ids = list(payload.subject_ids)
    subject_names = [n.strip() for n in payload.new_subject_names if n.strip()]
    if subject_names and branch_ids and payload.semesters:
        for branch_id in branch_ids:
            for semester in payload.semesters:
                for name in subject_names:
                    existing = db.query(Subject).filter(
                        Subject.branch_id == branch_id,
                        Subject.semester == semester,
                        Subject.name.ilike(name),
                    ).first()
                    if existing:
                        subject_ids.append(existing.id)
                        summary["subjects"]["reused"] += 1
                    else:
                        subject = Subject(name=name, semester=semester, branch_id=branch_id)
                        db.add(subject)
                        db.flush()
                        subject_ids.append(subject.id)
                        summary["subjects"]["created"] += 1
    subject_ids = list(dict.fromkeys(subject_ids))

    unit_names = [n.strip() for n in payload.unit_names if n.strip()]
    if unit_names and subject_ids:
        for subject_id in subject_ids:
            for i, name in enumerate(unit_names):
                existing = db.query(Unit).filter(Unit.subject_id == subject_id, Unit.name.ilike(name)).first()
                if existing:
                    summary["units"]["reused"] += 1
                else:
                    db.add(Unit(name=name, order_index=i + 1, subject_id=subject_id))
                    summary["units"]["created"] += 1

    if payload.dry_run:
        db.rollback()
    else:
        db.commit()
        for branch_id in branch_ids:
            delete_cache(f"subjects:{branch_id}:all")
            for semester in payload.semesters:
                delete_cache(f"subjects:{branch_id}:{semester}")
        for subject_id in subject_ids:
            delete_cache(f"units:{subject_id}")

    return summary


@router.post("/bulk-resource")
def bulk_resource(payload: BulkResourceRequest, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    matches = []
    for branch_id in payload.branch_ids:
        subject = db.query(Subject).filter(
            Subject.branch_id == branch_id,
            Subject.semester == payload.semester,
            Subject.name.ilike(payload.subject_name.strip()),
        ).first()
        if not subject:
            continue
        unit = db.query(Unit).filter(Unit.subject_id == subject.id, Unit.name.ilike(payload.unit_name.strip())).first()
        if unit:
            matches.append(unit)

    to_create, already_attached = [], []
    for unit in matches:
        existing = db.query(Resource).filter(Resource.unit_id == unit.id, Resource.url == payload.url).first()
        (already_attached if existing else to_create).append(unit)

    if payload.dry_run:
        return {"matched_units": len(matches), "will_create": len(to_create), "already_attached": len(already_attached)}

    video_id = extract_video_id(payload.url) if payload.type == "playlist" else None
    for unit in to_create:
        db.add(Resource(unit_id=unit.id, type=payload.type, title=payload.title, url=payload.url, youtube_video_id=video_id))
    db.commit()

    return {"matched_units": len(matches), "created": len(to_create), "already_attached": len(already_attached)}