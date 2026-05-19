import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from middleware.auth_middleware import get_current_user
from models.person import PersonCreate, PersonUpdate, PersonResponse
from models.connection import ConnectedPersonResponse
from services.people_service import (
    get_all_people,
    get_person_by_id,
    create_person,
    update_person,
    delete_person,
    set_person_photo,
)
from services.connection_service import get_person_connections

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "photos")
os.makedirs(UPLOADS_DIR, exist_ok=True)

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


@router.get("/{person_id}/connections", response_model=list[ConnectedPersonResponse])
async def get_connections(person_id: str, current_user: dict = Depends(get_current_user)):
    return await get_person_connections(person_id, current_user["user_id"])


@router.post("/{person_id}/photo", response_model=PersonResponse)
async def upload_photo(
    person_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, or GIF images are allowed")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 5 MB")

    ext = (file.filename or "img").rsplit(".", 1)[-1].lower() or "jpg"
    filename = f"{person_id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOADS_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    photo_url = f"/uploads/photos/{filename}"
    return await set_person_photo(person_id, photo_url, current_user["user_id"])
