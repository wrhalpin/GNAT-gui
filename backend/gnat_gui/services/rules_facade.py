from typing import Any

from sqlalchemy.orm import Session

from gnat_gui.audit.events import AuditAction
from gnat_gui.audit.service import AuditService
from gnat_gui.rbac.permissions import Permission
from gnat_gui.rbac.service import RBACService

_rbac = RBACService()


class RulesFacade:
    def __init__(self, db: Session, current_user: Any, audit: AuditService) -> None:
        self._db = db
        self._user = current_user
        self._audit = audit
        self._svc = self._load_service()

    def _load_service(self) -> Any:
        from gnat.analyst_services.rules import RulesService  # type: ignore[import]
        return RulesService()

    def list_rules(self, engine: str | None = None, scope: str | None = None) -> Any:
        _rbac.check(self._user.permissions, Permission.RULE_READ)
        return self._svc.list_rules(engine=engine, scope=scope)

    def get_rule(self, rule_id: str) -> Any:
        _rbac.check(self._user.permissions, Permission.RULE_READ)
        return self._svc.get_rule(rule_id)

    def create_rule(self, data: dict) -> Any:
        _rbac.check(self._user.permissions, Permission.RULE_CREATE)
        result = self._svc.create_rule(data, owner_id=self._user.id)
        self._audit.record(
            AuditAction.RULE_CREATED,
            user_id=self._user.id,
            username=self._user.username,
            target_id=result.id,
            target_type="rule",
        )
        return result

    def update_rule(self, rule_id: str, data: dict) -> Any:
        _rbac.check(self._user.permissions, Permission.RULE_UPDATE_OWN)
        result = self._svc.update_rule(rule_id, data)
        self._audit.record(
            AuditAction.RULE_UPDATED,
            user_id=self._user.id,
            username=self._user.username,
            target_id=rule_id,
            target_type="rule",
            diff=data,
        )
        return result

    def delete_rule(self, rule_id: str) -> None:
        _rbac.check(self._user.permissions, Permission.RULE_UPDATE_OWN)
        self._svc.delete_rule(rule_id)
        self._audit.record(
            AuditAction.RULE_DELETED,
            user_id=self._user.id,
            username=self._user.username,
            target_id=rule_id,
            target_type="rule",
        )

    def submit_test(self, rule_id: str, fixture: dict) -> str:
        _rbac.check(self._user.permissions, Permission.RULE_TEST)
        from gnat.jobs import JobRunner  # type: ignore[import]
        from gnat.jobs.store import JobStore  # type: ignore[import]
        store = JobStore()
        runner = JobRunner(store)
        job = runner.submit(
            "test_rule",
            submitted_by=self._user.id,
            request_payload={"rule_id": rule_id, "fixture": fixture},
        )
        self._audit.record(
            AuditAction.RULE_TESTED,
            user_id=self._user.id,
            username=self._user.username,
            target_id=rule_id,
            target_type="rule",
        )
        return job.id

    def get_audit_trail(self, rule_id: str) -> Any:
        _rbac.check(self._user.permissions, Permission.RULE_READ)
        return self._svc.get_audit_trail(rule_id)

    def promote_rule(self, rule_id: str) -> Any:
        _rbac.check(self._user.permissions, Permission.RULE_PUBLISH)
        result = self._svc.promote_rule(rule_id)
        self._audit.record(
            AuditAction.RULE_PROMOTED,
            user_id=self._user.id,
            username=self._user.username,
            target_id=rule_id,
            target_type="rule",
        )
        return result
