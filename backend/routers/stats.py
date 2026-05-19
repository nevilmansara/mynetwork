from fastapi import APIRouter, Depends
from middleware.auth_middleware import get_current_user
from services.stats_service import get_dashboard_stats

router = APIRouter()


@router.get("")
async def stats(current_user: dict = Depends(get_current_user)):
    return await get_dashboard_stats(current_user["user_id"])
