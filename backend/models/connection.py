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
