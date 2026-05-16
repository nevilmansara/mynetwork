from fastapi import APIRouter, Depends, status

from middleware.auth_middleware import get_current_user
from models.person import PersonCreate, PersonUpdate, PersonResponse
from services.people_service import (
    get_all_people,
    get_person_by_id,
    create_person,
    update_person,
    delete_person,
)

router = APIRouter()


@router.get("", response_model=list[PersonResponse])
async def list_people(current_user: dict = Depends(get_current_user)):
    return await get_all_people(current_user["user_id"])


@router.post("", response_model=PersonResponse, status_code=status.HTTP_201_CREATED)
async def add_person(data: PersonCreate, current_user: dict = Depends(get_current_user)):
    return await create_person(data, current_user["user_id"])


@router.get("/{person_id}", response_model=PersonResponse)
async def get_person(person_id: str, current_user: dict = Depends(get_current_user)):
    return await get_person_by_id(person_id, current_user["user_id"])


@router.put("/{person_id}", response_model=PersonResponse)
async def edit_person(person_id: str, data: PersonUpdate, current_user: dict = Depends(get_current_user)):
    return await update_person(person_id, data, current_user["user_id"])


@router.delete("/{person_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_person(person_id: str, current_user: dict = Depends(get_current_user)):
    await delete_person(person_id, current_user["user_id"])
