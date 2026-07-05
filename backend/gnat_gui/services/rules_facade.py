from typing import Any

from gnat_gui.audit.events import AuditAction
from gnat_gui.rbac.permissions import Permission
from gnat_gui.services.base import FacadeBase


class RulesFacade(FacadeBase):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self._svc = self._load_service()

    def _load_service(self) -> Any:
        from gnat.analyst_services.rules import RulesService  # type: ignore[import]

        return RulesService()

    def _owner_of(self, rule_id: str) -> str | None:
        """Rules live in the GNAT core DB; core stores the owner_id we pass at
        creation, so ownership is resolved from the core object."""
        try:
            rule = self._svc.get_rule(rule_id)
        except Exception:
            return None
        return getattr(rule, "owner_id", None)

    def list_rules(self, engine: str | None = None, scope: str | None = None) -> Any:
        self._check(Permission.RULE_READ)
        return self._svc.list_rules(engine=engine, scope=scope)

    def get_rule(self, rule_id: str) -> Any:
        self._check(Permission.RULE_READ)
        return self._svc.get_rule(rule_id)

    def create_rule(self, data: dict) -> Any:
        self._check(Permission.RULE_CREATE)
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
        self._check_owned(
            self._owner_of(rule_id),
            Permission.RULE_UPDATE_OWN,
            Permission.RULE_UPDATE_ANY,
        )
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
        self._check_owned(
            self._owner_of(rule_id),
            Permission.RULE_UPDATE_OWN,
            Permission.RULE_UPDATE_ANY,
        )
        self._svc.delete_rule(rule_id)
        self._audit.record(
            AuditAction.RULE_DELETED,
            user_id=self._user.id,
            username=self._user.username,
            target_id=rule_id,
            target_type="rule",
        )

    def submit_test(self, rule_id: str, fixture: dict) -> str:
        self._check(Permission.RULE_TEST)
        from gnat.jobs import JobRunner  # type: ignore[import]
        from gnat.jobs.store import JobStore  # type: ignore[import]

        runner = JobRunner(JobStore())
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
        self._check(Permission.RULE_READ)
        return self._svc.get_audit_trail(rule_id)

    def promote_rule(self, rule_id: str) -> Any:
        self._check(Permission.RULE_PUBLISH)
        result = self._svc.promote_rule(rule_id)
        self._audit.record(
            AuditAction.RULE_PROMOTED,
            user_id=self._user.id,
            username=self._user.username,
            target_id=rule_id,
            target_type="rule",
        )
        return result
