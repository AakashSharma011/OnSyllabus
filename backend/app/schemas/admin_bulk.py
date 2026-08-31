import uuid

from pydantic import BaseModel, Field


class NewCollege(BaseModel):
    name: str
    university: str = ""


class BulkStructureRequest(BaseModel):
    college_ids: list[uuid.UUID] = Field(default_factory=list)

    new_college: NewCollege | None = None

    branch_ids: list[uuid.UUID] = Field(default_factory=list)

    new_branch_names: list[str] = Field(default_factory=list)

    semesters: list[int] = Field(default_factory=list)

    # Kept for compatibility with the existing API.
    subject_ids: list[uuid.UUID] = Field(default_factory=list)

    # Existing subject names can be applied across all
    # matching selected branches + semesters.
    existing_subject_names: list[str] = Field(
        default_factory=list
    )

    new_subject_names: list[str] = Field(
        default_factory=list
    )

    unit_names: list[str] = Field(
        default_factory=list
    )

    dry_run: bool = False


class BulkResourceRequest(BaseModel):
    branch_ids: list[uuid.UUID]

    # Changed from one semester to multiple semesters.
    semester: int

    subject_name: str

    unit_name: str

    type: str

    title: str

    url: str

    dry_run: bool = False