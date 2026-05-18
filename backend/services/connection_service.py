import logging
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status

from database import get_db
from models.connection import (
    ConnectionCreate,
    ConnectionResponse,
    ConnectedPersonResponse,
    GraphNode,
    GraphLink,
    GraphData,
)

logger = logging.getLogger(__name__)

VALID_RELATIONSHIP_TYPES = {"friend", "colleague", "family", "mentor", "other"}


async def get_all_connections(user_id: str) -> list[ConnectionResponse]:
    async with get_db() as session:
        result = await session.run(
            """
            MATCH (u:User {id: $user_id})-[:OWNS]->(p1:Person)-[k:KNOWS]->(p2:Person)
            WHERE (u)-[:OWNS]->(p2) AND p1.id < p2.id
            RETURN k.id AS id, p1.id AS person1_id, p2.id AS person2_id,
                   k.relationship_type AS relationship_type,
                   k.since AS since, k.notes AS notes, k.created_at AS created_at
            ORDER BY k.created_at DESC
            """,
            user_id=user_id,
        )
        records = await result.data()
        return [
            ConnectionResponse(
                id=r["id"],
                person1_id=r["person1_id"],
                person2_id=r["person2_id"],
                relationship_type=r["relationship_type"],
                since=r.get("since"),
                notes=r.get("notes"),
                created_at=r.get("created_at"),
            )
            for r in records
        ]


async def get_person_connections(person_id: str, user_id: str) -> list[ConnectedPersonResponse]:
    async with get_db() as session:
        check = await session.run(
            "MATCH (u:User {id: $user_id})-[:OWNS]->(p:Person {id: $person_id}) RETURN p.id",
            user_id=user_id, person_id=person_id,
        )
        if not await check.single():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found")

        result = await session.run(
            """
            MATCH (p:Person {id: $person_id})-[k:KNOWS]->(other:Person)
            RETURN k.id AS connection_id, other,
                   k.relationship_type AS relationship_type,
                   k.since AS since, k.notes AS notes, k.created_at AS created_at
            ORDER BY other.name
            """,
            person_id=person_id,
        )
        records = await result.data()
        return [
            ConnectedPersonResponse(
                connection_id=r["connection_id"],
                id=r["other"]["id"],
                name=r["other"]["name"],
                occupation=r["other"].get("occupation"),
                company=r["other"].get("company"),
                skills=list(r["other"].get("skills") or []),
                photo_url=r["other"].get("photo_url"),
                is_self=r["other"].get("is_self", False),
                relationship_type=r["relationship_type"],
                since=r.get("since"),
                notes=r.get("notes"),
                created_at=r.get("created_at"),
            )
            for r in records
        ]


async def create_connection(data: ConnectionCreate, user_id: str) -> ConnectionResponse:
    if data.person1_id == data.person2_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot connect a person to themselves")

    rel_type = data.relationship_type if data.relationship_type in VALID_RELATIONSHIP_TYPES else "other"

    async with get_db() as session:
        # Verify both people are owned by this user
        check = await session.run(
            """
            MATCH (u:User {id: $user_id})-[:OWNS]->(p1:Person {id: $person1_id})
            MATCH (u)-[:OWNS]->(p2:Person {id: $person2_id})
            OPTIONAL MATCH (p1)-[existing:KNOWS]->(p2)
            RETURN p1.id AS p1, p2.id AS p2, existing.id AS existing_id
            """,
            user_id=user_id,
            person1_id=data.person1_id,
            person2_id=data.person2_id,
        )
        record = await check.single()
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or both people not found")
        if record["existing_id"]:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Connection already exists")

        now = datetime.now(timezone.utc).isoformat()
        conn_id = str(uuid.uuid4())

        await session.run(
            """
            MATCH (p1:Person {id: $person1_id})
            MATCH (p2:Person {id: $person2_id})
            CREATE (p1)-[:KNOWS {
                id: $conn_id,
                relationship_type: $rel_type,
                since: $since,
                notes: $notes,
                created_at: $now
            }]->(p2)
            CREATE (p2)-[:KNOWS {
                id: $conn_id,
                relationship_type: $rel_type,
                since: $since,
                notes: $notes,
                created_at: $now
            }]->(p1)
            """,
            person1_id=data.person1_id,
            person2_id=data.person2_id,
            conn_id=conn_id,
            rel_type=rel_type,
            since=data.since,
            notes=data.notes,
            now=now,
        )
        logger.info("Created connection %s between %s and %s", conn_id, data.person1_id, data.person2_id)
        return ConnectionResponse(
            id=conn_id,
            person1_id=data.person1_id,
            person2_id=data.person2_id,
            relationship_type=rel_type,
            since=data.since,
            notes=data.notes,
            created_at=now,
        )


async def delete_connection(connection_id: str, user_id: str) -> None:
    async with get_db() as session:
        # Verify user owns at least one person in this connection
        check = await session.run(
            """
            MATCH (u:User {id: $user_id})-[:OWNS]->(p:Person)-[k:KNOWS {id: $conn_id}]->(:Person)
            RETURN count(k) AS owned
            """,
            user_id=user_id,
            conn_id=connection_id,
        )
        record = await check.single()
        if not record or record["owned"] == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connection not found")

        await session.run(
            "MATCH ()-[k:KNOWS {id: $conn_id}]-() DELETE k",
            conn_id=connection_id,
        )
        logger.info("Deleted connection %s", connection_id)


async def get_graph_data(user_id: str) -> GraphData:
    async with get_db() as session:
        result = await session.run(
            """
            MATCH (u:User {id: $user_id})-[:OWNS]->(p:Person)
            OPTIONAL MATCH (p)-[:KNOWS]-(other:Person)
            WHERE (u)-[:OWNS]->(other)
            RETURN p, count(DISTINCT other) AS conn_count
            """,
            user_id=user_id,
        )
        people_records = await result.data()

        links_result = await session.run(
            """
            MATCH (u:User {id: $user_id})-[:OWNS]->(p1:Person)-[k:KNOWS]->(p2:Person)
            WHERE (u)-[:OWNS]->(p2) AND p1.id < p2.id
            RETURN p1.id AS source, p2.id AS target, k.relationship_type AS type
            """,
            user_id=user_id,
        )
        links_records = await links_result.data()

    nodes = [
        GraphNode(
            id=r["p"]["id"],
            name=r["p"]["name"],
            occupation=r["p"].get("occupation"),
            skills=list(r["p"].get("skills") or []),
            val=max(1, r["conn_count"]),
            is_self=r["p"].get("is_self", False),
        )
        for r in people_records
    ]
    links = [
        GraphLink(source=r["source"], target=r["target"], type=r["type"] or "other")
        for r in links_records
    ]
    return GraphData(nodes=nodes, links=links)
