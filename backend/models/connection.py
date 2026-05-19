from pydantic import BaseModel
from typing import Optional


class ConnectionCreate(BaseModel):
    person1_id: str
    person2_id: str
    relationship_type: str = "other"
    since: Optional[str] = None
    notes: Optional[str] = None


class ConnectionResponse(BaseModel):
    id: str
    person1_id: str
    person2_id: str
    relationship_type: str
    since: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None


class ConnectedPersonResponse(BaseModel):
    """Used for GET /people/{id}/connections — person details + connection metadata."""
    connection_id: str
    id: str
    name: str
    occupation: Optional[str] = None
    company: Optional[str] = None
    skills: list[str] = []
    photo_url: Optional[str] = None
    is_self: bool = False
    relationship_type: str
    since: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None


class GraphNode(BaseModel):
    id: str
    name: str
    occupation: Optional[str] = None
    skills: list[str] = []
    val: int = 1
    is_self: bool = False
    photo_url: Optional[str] = None


class GraphLink(BaseModel):
    source: str
    target: str
    type: str = "other"


class GraphData(BaseModel):
    nodes: list[GraphNode]
    links: list[GraphLink]
