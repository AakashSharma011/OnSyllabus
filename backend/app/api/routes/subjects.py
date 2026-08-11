from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def list_subjects(branch_id: str):
    return []