import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import init_driver, close_driver, create_indexes, get_db
from routers import auth, people, connections, search

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_driver()
    await create_indexes()
    logger.info("MyNetwork API started")
    yield
    await close_driver()
    logger.info("MyNetwork API stopped")


app = FastAPI(title="MyNetwork API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(people.router, prefix="/people", tags=["people"])
app.include_router(connections.router, prefix="/connections", tags=["connections"])
app.include_router(search.router, prefix="/search", tags=["search"])


@app.get("/health")
async def health() -> dict:
    timestamp = datetime.now(timezone.utc).isoformat()
    try:
        async with get_db() as session:
            await session.run("RETURN 1")
        return {"api": "ok", "database": "ok", "timestamp": timestamp}
    except Exception as exc:
        logger.error("Health check DB error: %s", exc)
        return {"api": "ok", "database": "error", "error": str(exc), "timestamp": timestamp}
