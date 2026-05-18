from fastapi import APIRouter, Depends, status

from middleware.auth_middleware import get_current_user
from models.connection import ConnectionCreate, ConnectionResponse, GraphData
from services.connection_service import (
    get_all_connections,
    create_connection,
    delete_connection,
    get_graph_data,
)

router = APIRouter()
graph_router = APIRouter()


@router.get("", response_model=list[ConnectionResponse])
async def list_connections(current_user: dict = Depends(get_current_user)):
    return await get_all_connections(current_user["user_id"])


@router.post("", response_model=ConnectionResponse, status_code=status.HTTP_201_CREATED)
async def add_connection(data: ConnectionCreate, current_user: dict = Depends(get_current_user)):
    return await create_connection(data, current_user["user_id"])


@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_connection(connection_id: str, current_user: dict = Depends(get_current_user)):
    await delete_connection(connection_id, current_user["user_id"])


@graph_router.get("", response_model=GraphData)
async def get_graph(current_user: dict = Depends(get_current_user)):
    return await get_graph_data(current_user["user_id"])
