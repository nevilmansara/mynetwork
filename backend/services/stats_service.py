import logging
from database import get_db

logger = logging.getLogger(__name__)


async def get_dashboard_stats(user_id: str) -> dict:
    async with get_db() as session:
        r1 = await session.run(
            "MATCH (u:User {id: $user_id})-[:OWNS]->(p:Person) RETURN count(p) AS total",
            user_id=user_id,
        )
        rec1 = await r1.single()
        total_people = rec1["total"] if rec1 else 0

        r2 = await session.run(
            """
            MATCH (u:User {id: $user_id})-[:OWNS]->(p1:Person)-[:KNOWS]->(p2:Person)
            WHERE (u)-[:OWNS]->(p2) AND p1.id < p2.id
            RETURN count(*) AS total
            """,
            user_id=user_id,
        )
        rec2 = await r2.single()
        total_connections = rec2["total"] if rec2 else 0

        r3 = await session.run(
            """
            MATCH (u:User {id: $user_id})-[:OWNS]->(p:Person)
            WHERE NOT coalesce(p.is_self, false)
            OPTIONAL MATCH (p)-[:KNOWS]->(other:Person)
            RETURN p.id AS id, p.name AS name, p.occupation AS occupation,
                   count(other) AS connections_count
            ORDER BY connections_count DESC
            LIMIT 1
            """,
            user_id=user_id,
        )
        rec3 = await r3.single()
        most_connected = None
        if rec3 and rec3["connections_count"] > 0:
            most_connected = {
                "id": rec3["id"],
                "name": rec3["name"],
                "occupation": rec3["occupation"],
                "connections_count": rec3["connections_count"],
            }

        r4 = await session.run(
            """
            MATCH (u:User {id: $user_id})-[:OWNS]->(p:Person)
            WHERE p.skills IS NOT NULL
            UNWIND p.skills AS skill
            RETURN skill, count(*) AS cnt
            ORDER BY cnt DESC, skill
            LIMIT 8
            """,
            user_id=user_id,
        )
        skills_records = await r4.data()
        top_skills = [{"skill": r["skill"], "count": r["cnt"]} for r in skills_records]

        r5 = await session.run(
            """
            MATCH (u:User {id: $user_id})-[:OWNS]->(p:Person)
            WHERE NOT coalesce(p.is_self, false)
            RETURN p.id AS id, p.name AS name, p.occupation AS occupation,
                   p.company AS company, p.created_at AS created_at
            ORDER BY p.created_at DESC
            LIMIT 5
            """,
            user_id=user_id,
        )
        recent_records = await r5.data()
        recent_people = [
            {
                "id": r["id"],
                "name": r["name"],
                "occupation": r["occupation"],
                "company": r["company"],
                "created_at": r["created_at"],
            }
            for r in recent_records
        ]

    return {
        "total_people": total_people,
        "total_connections": total_connections,
        "most_connected": most_connected,
        "top_skills": top_skills,
        "recent_people": recent_people,
    }
