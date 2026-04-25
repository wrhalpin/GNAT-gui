from typing import Annotated, Any

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from gnat_gui.audit.service import AuditService
from gnat_gui.auth.middleware import get_session_token
from gnat_gui.auth.service import AuthService
from gnat_gui.db.session import get_db


def get_audit(db: Session = Depends(get_db)) -> AuditService:
    return AuditService(db)


def get_current_user(
    token: str = Depends(get_session_token),
    db: Session = Depends(get_db),
    audit: AuditService = Depends(get_audit),
) -> Any:
    auth = AuthService(db, audit)
    user, permissions = auth.get_session_user(token)
    user.permissions = permissions  # type: ignore[attr-defined]
    return user


def get_source_ip(request: Request) -> str | None:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


CurrentUser = Annotated[Any, Depends(get_current_user)]
DB = Annotated[Session, Depends(get_db)]
Audit = Annotated[AuditService, Depends(get_audit)]
SourceIP = Annotated[str | None, Depends(get_source_ip)]
