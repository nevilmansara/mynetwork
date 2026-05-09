import logging
from contextlib import asynccontextmanager
from neo4j import AsyncGraphDatabase, AsyncDriver
from config import settings

logger = logging.getLogger(__name__)

_driver: AsyncDriver | None = None


async def init_driver() -> None:
    global _driver
    _driver = AsyncGraphDatabase.driver(
        settings.neo4j_uri,
        auth=(settings.neo4j_user, settings.neo4j_password),
        max_connection_pool_size=10,
    )
    await _driver.verify_connectivity()
    logger.info("Neo4j async driver initialized and connectivity verified")


async def close_driver() -> None:
    global _driver
    if _driver is not None:
        await _driver.close()
        _driver = None
        logger.info("Neo4j driver closed")


@asynccontextmanager
async def get_db():
    """Async context manager that yields a Neo4j session."""
    async with _driver.session() as session:
        yield session


async def create_indexes() -> None:
    """Create all required Neo4j indexes on startup (idempotent)."""
    async with get_db() as session:
        await session.run(
            "CREATE INDEX user_id_index IF NOT EXISTS FOR (u:User) ON (u.id)"
        )
        await session.run(
            "CREATE INDEX user_email_index IF NOT EXISTS FOR (u:User) ON (u.email)"
        )
        await session.run(
            "CREATE INDEX person_id_index IF NOT EXISTS FOR (p:Person) ON (p.id)"
        )
        await session.run(
            "CREATE FULLTEXT INDEX person_search IF NOT EXISTS "
            "FOR (n:Person) ON EACH [n.name, n.occupation, n.skills]"
        )
    logger.info("Neo4j indexes ensured")
