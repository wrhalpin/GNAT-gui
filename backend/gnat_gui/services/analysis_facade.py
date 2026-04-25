from typing import Any

from sqlalchemy.orm import Session

from gnat_gui.audit.events import AuditAction
from gnat_gui.audit.service import AuditService
from gnat_gui.rbac.permissions import Permission
from gnat_gui.rbac.service import RBACService

_rbac = RBACService()


class AnalysisFacade:
    def __init__(self, db: Session, current_user: Any, audit: AuditService) -> None:
        self._db = db
        self._user = current_user
        self._audit = audit
        self._svc = self._load_service()

    def _load_service(self) -> Any:
        from gnat.analyst_services.analysis import AnalysisService  # type: ignore[import]
        return AnalysisService()

    def list_investigations(self, status: str | None = None, page: int = 1, page_size: int = 50) -> Any:
        _rbac.check(self._user.permissions, Permission.INVESTIGATION_READ_OWN)
        return self._svc.list_investigations(owner_id=self._user.id, status=status, page=page, page_size=page_size)

    def get_investigation(self, investigation_id: str) -> Any:
        _rbac.check(self._user.permissions, Permission.INVESTIGATION_READ_OWN)
        return self._svc.get_investigation(investigation_id)

    def create_investigation(self, data: dict) -> Any:
        _rbac.check(self._user.permissions, Permission.INVESTIGATION_CREATE)
        result = self._svc.create_investigation(data, owner_id=self._user.id)
        self._audit.record(
            AuditAction.INVESTIGATION_CREATED,
            user_id=self._user.id,
            username=self._user.username,
            target_id=result.id,
            target_type="investigation",
        )
        return result

    def update_investigation(self, investigation_id: str, data: dict) -> Any:
        _rbac.check(self._user.permissions, Permission.INVESTIGATION_UPDATE_OWN)
        result = self._svc.update_investigation(investigation_id, data)
        self._audit.record(
            AuditAction.INVESTIGATION_UPDATED,
            user_id=self._user.id,
            username=self._user.username,
            target_id=investigation_id,
            target_type="investigation",
            diff=data,
        )
        return result

    def delete_investigation(self, investigation_id: str) -> None:
        _rbac.check(self._user.permissions, Permission.INVESTIGATION_DELETE_OWN)
        self._svc.delete_investigation(investigation_id)
        self._audit.record(
            AuditAction.INVESTIGATION_DELETED,
            user_id=self._user.id,
            username=self._user.username,
            target_id=investigation_id,
            target_type="investigation",
        )

    def create_hypothesis(self, investigation_id: str, data: dict) -> Any:
        _rbac.check(self._user.permissions, Permission.INVESTIGATION_UPDATE_OWN)
        result = self._svc.create_hypothesis(investigation_id, data)
        self._audit.record(
            AuditAction.HYPOTHESIS_CREATED,
            user_id=self._user.id,
            username=self._user.username,
            target_id=result.id,
            target_type="hypothesis",
        )
        return result

    def update_hypothesis(self, investigation_id: str, hypothesis_id: str, data: dict) -> Any:
        _rbac.check(self._user.permissions, Permission.INVESTIGATION_UPDATE_OWN)
        result = self._svc.update_hypothesis(investigation_id, hypothesis_id, data)
        self._audit.record(
            AuditAction.HYPOTHESIS_UPDATED,
            user_id=self._user.id,
            username=self._user.username,
            target_id=hypothesis_id,
            target_type="hypothesis",
            diff=data,
        )
        return result

    def create_note(self, investigation_id: str, data: dict) -> Any:
        _rbac.check(self._user.permissions, Permission.INVESTIGATION_UPDATE_OWN)
        result = self._svc.create_note(investigation_id, data, author_id=self._user.id)
        self._audit.record(
            AuditAction.NOTE_CREATED,
            user_id=self._user.id,
            username=self._user.username,
            target_id=investigation_id,
            target_type="investigation",
        )
        return result

    def get_timeline(self, investigation_id: str) -> Any:
        _rbac.check(self._user.permissions, Permission.INVESTIGATION_READ_OWN)
        return self._svc.get_timeline(investigation_id)
