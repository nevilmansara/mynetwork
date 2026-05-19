from __future__ import annotations
from pydantic import BaseModel
from typing import List, Optional


class PersonCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    occupation: Optional[str] = None
    company: Optional[str] = None
    skills: List[str] = []
    location: Optional[str] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None


class PersonUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    occupation: Optional[str] = None
    company: Optional[str] = None
    skills: Optional[List[str]] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None


class PersonResponse(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    occupation: Optional[str] = None
    company: Optional[str] = None
    skills: List[str] = []
    location: Optional[str] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None
    is_self: bool = False
    connections_count: int = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class PathNode(BaseModel):
    id: str
    name: str
    occupation: Optional[str] = None
    skills: List[str] = []
    is_self: bool = False


class PathResult(BaseModel):
    path: List[PathNode]
    hops: int
