from sqlalchemy.orm import Session

from gnat_gui.audit.events import AuditAction
from gnat_gui.db.models.audit import AuditEvent


class AuditService:
    def __init__(self, db: Session) -> None:
        self._db = db

    def record(
        self,
        action: AuditAction,
        *,
        user_id: str | None = None,
        username: str | None = None,
        target_id: str | None = None,
        target_type: str | None = None,
        diff: dict | None = None,
        source_ip: str | None = None,
        request_id: str | None = None,
    ) -> None:
        event = AuditEvent(
            user_id=user_id,
            username=username,
            action=action,
            target_id=target_id,
            target_type=target_type,
            diff=diff,
            source_ip=source_ip,
            request_id=request_id,
        )
        self._db.add(event)
        self._db.flush()
