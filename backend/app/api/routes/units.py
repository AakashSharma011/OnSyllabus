from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def list_units(subject_id: str):
    return []
