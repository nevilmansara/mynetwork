import logging
from typing import List, Optional

from fastapi import HTTPException, status

from database import get_db
from models.person import PersonResponse, PathNode, PathResult

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


async def search_people(query: str, user_id: str) -> List[PersonResponse]:
    async with get_db() as session:
        result = await session.run(
            """
            MATCH (u:User {id: $user_id})-[:OWNS]->(p:Person)
            WHERE toLower(p.name) CONTAINS toLower($q)
               OR toLower(coalesce(p.occupation, '')) CONTAINS toLower($q)
               OR toLower(coalesce(p.company, '')) CONTAINS toLower($q)
               OR ANY(s IN coalesce(p.skills, []) WHERE toLower(s) CONTAINS toLower($q))
            OPTIONAL MATCH (p)-[:KNOWS]->(other:Person)
            RETURN p, count(other) AS connections_count
            ORDER BY p.name
            """,
            user_id=user_id,
            q=query,
        )
        records = await result.data()
        return [_record_to_person(r) for r in records]


async def find_path(to_id: str, my_person_id: str, user_id: str) -> Optional[PathResult]:
    async with get_db() as session:
        check = await session.run(
            "MATCH (u:User {id: $user_id})-[:OWNS]->(p:Person {id: $to_id}) RETURN p.id",
            user_id=user_id,
            to_id=to_id,
        )
        if not await check.single():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found")

        result = await session.run(
            """
            MATCH (start:Person {id: $from_id}), (target:Person {id: $to_id})
            MATCH path = shortestPath((start)-[:KNOWS*1..6]-(target))
            RETURN [n IN nodes(path) | {
                id:         n.id,
                name:       n.name,
                occupation: n.occupation,
                skills:     coalesce(n.skills, []),
                is_self:    coalesce(n.is_self, false)
            }] AS path_nodes,
            length(path) AS hops
            """,
            from_id=my_person_id,
            to_id=to_id,
        )
        record = await result.single()
        if not record:
            return None

        return PathResult(
            path=[
                PathNode(
                    id=n["id"],
                    name=n["name"],
                    occupation=n.get("occupation"),
                    skills=list(n.get("skills") or []),
                    is_self=bool(n.get("is_self", False)),
                )
                for n in record["path_nodes"]
            ],
            hops=record["hops"],
        )
