import logging
import uuid
import bcrypt
from datetime import datetime, timezone, timedelta

from jose import jwt
from fastapi import HTTPException, status

from database import get_db
from config import settings
from models.user import UserRegister, UserLogin, UserResponse, TokenResponse

logger = logging.getLogger(__name__)


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _create_access_token(payload: dict) -> str:
    data = payload.copy()
    data["exp"] = datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expire_hours)
    return jwt.encode(data, settings.jwt_secret, algorithm=settings.jwt_algorithm)


async def register_user(data: UserRegister) -> UserResponse:
    async with get_db() as session:
        existing = await session.run(
            "MATCH (u:User {email: $email}) RETURN u.id",
            email=data.email,
        )
        if await existing.single():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists",
            )

        now = datetime.now(timezone.utc).isoformat()
        user_id = str(uuid.uuid4())
        person_id = str(uuid.uuid4())

        result = await session.run(
            """
            CREATE (u:User {
                id: $user_id,
                name: $name,
                email: $email,
                password_hash: $password_hash,
                created_at: $now
            })
            CREATE (p:Person {
                id: $person_id,
                name: $name,
                email: $email,
                skills: [],
                is_self: true,
                created_at: $now,
                updated_at: $now
            })
            CREATE (u)-[:OWNS]->(p)
            RETURN u.id AS user_id, u.name AS name, u.email AS email,
                   u.created_at AS created_at, p.id AS person_id
            """,
            user_id=user_id,
            person_id=person_id,
            name=data.name,
            email=data.email,
            password_hash=_hash_password(data.password),
            now=now,
        )
        record = await result.single()
        if not record:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Registration failed — please try again",
            )

        logger.info("Registered new user: %s", data.email)
        return UserResponse(
            id=record["user_id"],
            name=record["name"],
            email=record["email"],
            my_person_id=record["person_id"],
            created_at=record["created_at"],
        )


async def login_user(data: UserLogin) -> TokenResponse:
    async with get_db() as session:
        result = await session.run(
            """
            MATCH (u:User {email: $email})-[:OWNS]->(p:Person {is_self: true})
            RETURN u.id AS user_id, u.name AS name, u.email AS email,
                   u.password_hash AS password_hash, u.created_at AS created_at,
                   p.id AS person_id
            """,
            email=data.email,
        )
        record = await result.single()

        if not record or not _verify_password(data.password, record["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        user = UserResponse(
            id=record["user_id"],
            name=record["name"],
            email=record["email"],
            my_person_id=record["person_id"],
            created_at=record["created_at"],
        )
        token = _create_access_token({
            "user_id": user.id,
            "email": user.email,
            "my_person_id": user.my_person_id,
        })
        logger.info("User logged in: %s", data.email)
        return TokenResponse(access_token=token, token_type="bearer", user=user)


async def get_me(user_id: str) -> UserResponse:
    async with get_db() as session:
        result = await session.run(
            """
            MATCH (u:User {id: $user_id})-[:OWNS]->(p:Person {is_self: true})
            RETURN u.id AS user_id, u.name AS name, u.email AS email,
                   u.created_at AS created_at, p.id AS person_id
            """,
            user_id=user_id,
        )
        record = await result.single()
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return UserResponse(
            id=record["user_id"],
            name=record["name"],
            email=record["email"],
            my_person_id=record["person_id"],
            created_at=record["created_at"],
        )
