from fastapi import APIRouter, Depends
from app.api.deps import get_admin_user
from app.models.user import User
from app.services.cache_service import clear_prefix

router = APIRouter()

@router.post("/clear-cache")
def clear_cache(current_user: User = Depends(get_admin_user)):
    return {
        "subjects_cleared": clear_prefix("subjects:"),
        "units_cleared": clear_prefix("units:"),
    }