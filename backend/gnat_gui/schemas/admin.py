from datetime import datetime

from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=128)
    password: str = Field(min_length=12)
    role: str


class UserResponse(BaseModel):
    user_id: str
    username: str
    role: str
    is_active: bool
    created_at: datetime


class UserUpdate(BaseModel):
    role: str | None = None
    is_active: bool | None = None


class AuditEventResponse(BaseModel):
    id: str
    user_id: str | None
    username: str | None
    action: str
    target_id: str | None
    target_type: str | None
    source_ip: str | None
    timestamp: datetime


class AuditListResponse(BaseModel):
    items: list[AuditEventResponse]
    total: int
    page: int
    page_size: int
