from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    model_config = ConfigDict(strict=True)

    username: str
    password: str


class MeResponse(BaseModel):
    user_id: str
    username: str
    role: str
    permissions: list[str]


class SessionResponse(BaseModel):
    user_id: str
    username: str
    role: str
    expires_at: datetime
