from fastapi import APIRouter

router = APIRouter()


@router.get("/overview")
def analytics_overview():
    return {"total_clicks": 0, "total_users": 0}