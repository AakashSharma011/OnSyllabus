from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def list_branches(college_id: str):
    return []