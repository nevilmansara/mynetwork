from typing import List, Optional

from fastapi import APIRouter, Depends, Query

from middleware.auth_middleware import get_current_user
from models.person import PersonResponse, PathResult
from services.search_service import search_people, find_path

router = APIRouter()


@router.get("", response_model=List[PersonResponse])
async def search(
    q: str = Query(..., min_length=1),
    current_user: dict = Depends(get_current_user),
):
    return await search_people(q.strip(), current_user["user_id"])


@router.get("/path", response_model=Optional[PathResult])
async def path(
    to: str = Query(...),
    current_user: dict = Depends(get_current_user),
):
    return await find_path(to, current_user["my_person_id"], current_user["user_id"])
