from pydantic import BaseModel


class UIStateGet(BaseModel):
    key: str
    value: dict


class UIStatePut(BaseModel):
    value: dict


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: float | None = None
    message: str | None = None
    result: dict | None = None
    error: str | None = None
