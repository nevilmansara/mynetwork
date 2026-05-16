from fastapi import APIRouter, Depends, status

from models.user import UserRegister, UserLogin, UserResponse, TokenResponse
from services.auth_service import register_user, login_user, get_me
from middleware.auth_middleware import get_current_user

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister):
    return await register_user(data)


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    return await login_user(data)


@router.get("/me", response_model=UserResponse)
async def me(current_user: dict = Depends(get_current_user)):
    return await get_me(current_user["user_id"])
