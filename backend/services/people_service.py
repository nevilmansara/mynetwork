import logging
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status

from database import get_db
from models.person import PersonCreate, PersonUpdate, PersonResponse

logger = logging.getLogger(__name__)


def _record_to_person(record: dict) -> PersonResponse:
    p = record["p"]
    return PersonResponse(
        id=p["id"],
        name=p["name"],
        email=p.get("email"),
        phone=p.get("phone"),
        occupation=p.get("occupation"),
        company=p.get("company"),
        skills=list(p.get("skills") or []),
        location=p.get("location"),
        notes=p.get("notes"),
        photo_url=p.get("photo_url"),
        is_self=p.get("is_self", False),
        connections_count=record.get("connections_count", 0),
        created_at=p.get("created_at"),
        updated_at=p.get("updated_at"),
    )


async def get_all_people(user_id: str) -> list[PersonResponse]:
    async with get_db() as session:
        result = await session.run(
            """
            MATCH (u:User {id: $user_id})-[:OWNS]->(p:Person)
            OPTIONAL MATCH (p)-[:KNOWS]->(other:Person)
            RETURN p, count(other) AS connections_count
            ORDER BY p.name
            """,
            user_id=user_id,
        )
        records = await result.data()
        return [_record_to_person(r) for r in records]


async def get_person_by_id(person_id: str, user_id: str) -> PersonResponse:
    async with get_db() as session:
        result = await session.run(
            """
            MATCH (u:User {id: $user_id})-[:OWNS]->(p:Person {id: $person_id})
            OPTIONAL MATCH (p)-[:KNOWS]->(other:Person)
            RETURN p, count(other) AS connections_count
            """,
            user_id=user_id,
            person_id=person_id,
        )
        record = await result.single()
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found")
        return _record_to_person(dict(record))


async def create_person(data: PersonCreate, user_id: str) -> PersonResponse:
    async with get_db() as session:
        now = datetime.now(timezone.utc).isoformat()
        person_id = str(uuid.uuid4())
        result = await session.run(
            """
            MATCH (u:User {id: $user_id})
            CREATE (p:Person {
                id: $person_id,
                name: $name,
                email: $email,
                phone: $phone,
                occupation: $occupation,
                company: $company,
                skills: $skills,
                location: $location,
                notes: $notes,
                photo_url: $photo_url,
                is_self: false,
                created_at: $now,
                updated_at: $now
            })
            CREATE (u)-[:OWNS]->(p)
            RETURN p, 0 AS connections_count
            """,
            user_id=user_id,
            person_id=person_id,
            name=data.name,
            email=data.email,
            phone=data.phone,
            occupation=data.occupation,
            company=data.company,
            skills=data.skills or [],
            location=data.location,
            notes=data.notes,
            photo_url=data.photo_url,
            now=now,
        )
        record = await result.single()
        if not record:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create person")
        logger.info("Created person %s for user %s", person_id, user_id)
        return _record_to_person(dict(record))


async def update_person(person_id: str, data: PersonUpdate, user_id: str) -> PersonResponse:
    async with get_db() as session:
        existing = await session.run(
            "MATCH (u:User {id: $user_id})-[:OWNS]->(p:Person {id: $person_id}) RETURN p.id",
            user_id=user_id,
            person_id=person_id,
        )
        if not await existing.single():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found")

        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        if not updates:
            return await get_person_by_id(person_id, user_id)

        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        set_clause = ", ".join(f"p.{k} = ${k}" for k in updates)

        result = await session.run(
            f"""
            MATCH (u:User {{id: $user_id}})-[:OWNS]->(p:Person {{id: $person_id}})
            SET {set_clause}
            WITH p
            OPTIONAL MATCH (p)-[:KNOWS]->(other:Person)
            RETURN p, count(other) AS connections_count
            """,
            user_id=user_id,
            person_id=person_id,
            **updates,
        )
        record = await result.single()
        logger.info("Updated person %s", person_id)
        return _record_to_person(dict(record))


async def delete_person(person_id: str, user_id: str) -> None:
    async with get_db() as session:
        check = await session.run(
            """
            MATCH (u:User {id: $user_id})-[:OWNS]->(p:Person {id: $person_id})
            RETURN p.is_self AS is_self
            """,
            user_id=user_id,
            person_id=person_id,
        )
        record = await check.single()
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found")
        if record["is_self"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot delete your self node")

        await session.run(
            "MATCH (p:Person {id: $person_id}) DETACH DELETE p",
            person_id=person_id,
        )
        logger.info("Deleted person %s", person_id)
