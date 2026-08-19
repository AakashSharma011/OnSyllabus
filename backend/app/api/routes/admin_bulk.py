from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_admin_user
from app.models.user import User
from app.models.college import College
from app.models.branch import Branch
from app.models.subject import Subject
from app.models.unit import Unit
from app.models.resource import Resource
from app.schemas.admin_bulk import (
    BulkStructureRequest,
    BulkResourceRequest,
)
from app.utils.youtube import extract_video_id
from app.services.cache_service import delete_cache

router = APIRouter()


def clean_unique_names(names):
    result = []
    seen = set()

    for value in names:
        cleaned = value.strip()

        if not cleaned:
            continue

        key = cleaned.lower()

        if key not in seen:
            seen.add(key)
            result.append(cleaned)

    return result


@router.post("/bulk-structure")
def bulk_structure(
    payload: BulkStructureRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    summary = {
        "colleges": {
            "created": 0,
            "reused": 0,
        },
        "branches": {
            "created": 0,
            "reused": 0,
        },
        "semesters": {
            "selected": 0,
        },
        "subjects": {
            "created": 0,
            "reused": 0,
        },
        "units": {
            "created": 0,
            "reused": 0,
        },
    }

    try:
        # -------------------------------------------------------
        # 1. Colleges
        # -------------------------------------------------------

        college_ids = list(
            dict.fromkeys(payload.college_ids)
        )

        summary["colleges"]["reused"] += len(
            college_ids
        )

        if (
            payload.new_college
            and payload.new_college.name.strip()
        ):
            name = payload.new_college.name.strip()

            existing = (
                db.query(College)
                .filter(
                    func.lower(func.trim(College.name))
                    == name.lower()
                )
                .first()
            )

            if existing:
                college_ids.append(existing.id)
                summary["colleges"]["reused"] += 1
            else:
                college = College(
                    name=name,
                    university=(
                        payload.new_college.university or ""
                    ).strip(),
                )

                db.add(college)
                db.flush()

                college_ids.append(college.id)
                summary["colleges"]["created"] += 1

        college_ids = list(
            dict.fromkeys(college_ids)
        )

        # -------------------------------------------------------
        # 2. Branches
        # -------------------------------------------------------

        branch_ids = list(
            dict.fromkeys(payload.branch_ids)
        )

        new_branch_names = clean_unique_names(
            payload.new_branch_names
        )

        if new_branch_names and not college_ids:
            raise ValueError(
                "Branches require at least one college."
            )

        for college_id in college_ids:
            for name in new_branch_names:
                existing = (
                    db.query(Branch)
                    .filter(
                        Branch.college_id == college_id,
                        func.lower(func.trim(Branch.name))
                        == name.lower(),
                    )
                    .first()
                )

                if existing:
                    branch_ids.append(existing.id)
                    summary["branches"]["reused"] += 1
                else:
                    branch = Branch(
                        name=name,
                        college_id=college_id,
                    )

                    db.add(branch)
                    db.flush()

                    branch_ids.append(branch.id)
                    summary["branches"]["created"] += 1

        branch_ids = list(
            dict.fromkeys(branch_ids)
        )

        # -------------------------------------------------------
        # 3. Semesters
        # -------------------------------------------------------

        semesters = sorted(
            {
                int(semester)
                for semester in payload.semesters
                if 1 <= int(semester) <= 8
            }
        )

        if payload.semesters and not semesters:
            raise ValueError(
                "Semesters must be between 1 and 8."
            )

        if semesters and not branch_ids:
            raise ValueError(
                "Semesters require at least one branch."
            )

        summary["semesters"]["selected"] = len(
            semesters
        )

        # -------------------------------------------------------
        # 4. Existing subjects
        #
        # Resolve existing subjects by name across every
        # selected branch + semester combination.
        # -------------------------------------------------------

        subject_ids = list(
            dict.fromkeys(payload.subject_ids)
        )

        existing_subject_names = clean_unique_names(
            payload.existing_subject_names
        )

        if existing_subject_names:
            if not branch_ids or not semesters:
                raise ValueError(
                    "Existing subjects require branches and semesters."
                )

            for branch_id in branch_ids:
                for semester in semesters:
                    for name in existing_subject_names:
                        subject = (
                            db.query(Subject)
                            .filter(
                                Subject.branch_id == branch_id,
                                Subject.semester == semester,
                                func.lower(
                                    func.trim(Subject.name)
                                )
                                == name.lower(),
                            )
                            .first()
                        )

                        if subject:
                            subject_ids.append(
                                subject.id
                            )
                            summary["subjects"][
                                "reused"
                            ] += 1

        subject_ids = list(
            dict.fromkeys(subject_ids)
        )

        # -------------------------------------------------------
        # 5. New subjects
        # -------------------------------------------------------

        new_subject_names = clean_unique_names(
            payload.new_subject_names
        )

        if new_subject_names:
            if not branch_ids:
                raise ValueError(
                    "New subjects require at least one branch."
                )

            if not semesters:
                raise ValueError(
                    "New subjects require at least one semester."
                )

            for branch_id in branch_ids:
                for semester in semesters:
                    for name in new_subject_names:
                        existing = (
                            db.query(Subject)
                            .filter(
                                Subject.branch_id == branch_id,
                                Subject.semester == semester,
                                func.lower(
                                    func.trim(Subject.name)
                                )
                                == name.lower(),
                            )
                            .first()
                        )

                        if existing:
                            subject_ids.append(
                                existing.id
                            )
                            summary["subjects"][
                                "reused"
                            ] += 1
                        else:
                            subject = Subject(
                                name=name,
                                semester=semester,
                                branch_id=branch_id,
                            )

                            db.add(subject)
                            db.flush()

                            subject_ids.append(
                                subject.id
                            )

                            summary["subjects"][
                                "created"
                            ] += 1

        subject_ids = list(
            dict.fromkeys(subject_ids)
        )

        # -------------------------------------------------------
        # 6. Units
        # -------------------------------------------------------

        unit_names = clean_unique_names(
            payload.unit_names
        )

        if unit_names and not subject_ids:
            raise ValueError(
                "Units require at least one subject."
            )

        for subject_id in subject_ids:
            for index, name in enumerate(
                unit_names,
                start=1,
            ):
                existing = (
                    db.query(Unit)
                    .filter(
                        Unit.subject_id == subject_id,
                        func.lower(func.trim(Unit.name))
                        == name.lower(),
                    )
                    .first()
                )

                if existing:
                    summary["units"]["reused"] += 1
                else:
                    db.add(
                        Unit(
                            name=name,
                            order_index=index,
                            subject_id=subject_id,
                        )
                    )

                    summary["units"]["created"] += 1

        # -------------------------------------------------------
        # 7. Commit / dry run
        # -------------------------------------------------------

        if payload.dry_run:
            db.rollback()
            return summary

        db.commit()

        # -------------------------------------------------------
        # 8. Cache invalidation
        # -------------------------------------------------------

        for branch_id in branch_ids:
            delete_cache(
                f"subjects:{branch_id}:all"
            )

            for semester in semesters:
                delete_cache(
                    f"subjects:{branch_id}:{semester}"
                )

        for subject_id in subject_ids:
            delete_cache(
                f"units:{subject_id}"
            )

        return summary

    except Exception:
        db.rollback()
        raise


@router.post("/bulk-resource")
def bulk_resource(
    payload: BulkResourceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    semesters = sorted(
        {
            int(semester)
            for semester in payload.semesters
            if 1 <= int(semester) <= 8
        }
    )

    if not semesters:
        raise ValueError(
            "Select at least one semester."
        )

    subject_name = payload.subject_name.strip()
    unit_name = payload.unit_name.strip()

    matches = []

    # -----------------------------------------------------------
    # Find all matching units across:
    # branch × semester
    # -----------------------------------------------------------

    for branch_id in payload.branch_ids:
        for semester in semesters:
            subject = (
                db.query(Subject)
                .filter(
                    Subject.branch_id == branch_id,
                    Subject.semester == semester,
                    func.lower(
                        func.trim(Subject.name)
                    )
                    == subject_name.lower(),
                )
                .first()
            )

            if not subject:
                continue

            unit = (
                db.query(Unit)
                .filter(
                    Unit.subject_id == subject.id,
                    func.lower(
                        func.trim(Unit.name)
                    )
                    == unit_name.lower(),
                )
                .first()
            )

            if unit:
                matches.append(unit)

    # Remove duplicate units.
    unique_units = {
        unit.id: unit
        for unit in matches
    }

    matches = list(
        unique_units.values()
    )

    # -----------------------------------------------------------
    # Check whether the resource is already attached.
    # -----------------------------------------------------------

    to_create = []
    already_attached = []

    for unit in matches:
        existing = (
            db.query(Resource)
            .filter(
                Resource.unit_id == unit.id,
                Resource.url == payload.url,
            )
            .first()
        )

        if existing:
            already_attached.append(unit)
        else:
            to_create.append(unit)

    if payload.dry_run:
        return {
            "matched_units": len(matches),
            "will_create": len(to_create),
            "already_attached": len(
                already_attached
            ),
        }

    video_id = (
        extract_video_id(payload.url)
        if payload.type == "video"
        else None
    )

    for unit in to_create:
        db.add(
            Resource(
                unit_id=unit.id,
                type=payload.type,
                title=payload.title.strip(),
                url=payload.url.strip(),
                youtube_video_id=video_id,
            )
        )

    db.commit()

    return {
        "matched_units": len(matches),
        "created": len(to_create),
        "already_attached": len(
            already_attached
        ),
    }