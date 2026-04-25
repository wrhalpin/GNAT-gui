from typing import Any

from sqlalchemy.orm import Session

from gnat_gui.audit.events import AuditAction
from gnat_gui.audit.service import AuditService
from gnat_gui.rbac.permissions import Permission
from gnat_gui.rbac.service import RBACService

_rbac = RBACService()


class InvestigationsFacade:
    def __init__(self, db: Session, current_user: Any, audit: AuditService) -> None:
        self._db = db
        self._user = current_user
        self._audit = audit

    def _get_runner(self) -> tuple[Any, Any]:
        from gnat.jobs import JobRunner  # type: ignore[import]
        from gnat.jobs.store import JobStore  # type: ignore[import]
        store = JobStore()
        return JobRunner(store), store

    def submit_build(self, seeds: list[dict]) -> str:
        _rbac.check(self._user.permissions, Permission.INVESTIGATION_CREATE)
        runner, _ = self._get_runner()
        job = runner.submit(
            "build_investigation",
            submitted_by=self._user.id,
            request_payload={"seeds": seeds},
        )
        return job.id

    def get_graph(self, investigation_id: str) -> Any:
        _rbac.check(self._user.permissions, Permission.INVESTIGATION_READ_OWN)
        from gnat.analyst_services.investigations import InvestigationsService  # type: ignore[import]
        svc = InvestigationsService()
        return svc.get_graph(investigation_id)

    def submit_expand(self, investigation_id: str, node_id: str) -> str:
        _rbac.check(self._user.permissions, Permission.INVESTIGATION_UPDATE_OWN)
        runner, _ = self._get_runner()
        job = runner.submit(
            "expand_node",
            submitted_by=self._user.id,
            request_payload={"investigation_id": investigation_id, "node_id": node_id},
        )
        return job.id

    def materialize(self, investigation_id: str) -> Any:
        _rbac.check(self._user.permissions, Permission.INVESTIGATION_MATERIALIZE)
        from gnat.analyst_services.investigations import InvestigationsService  # type: ignore[import]
        svc = InvestigationsService()
        result = svc.materialize(investigation_id)
        self._audit.record(
            AuditAction.INVESTIGATION_MATERIALIZED,
            user_id=self._user.id,
            username=self._user.username,
            target_id=investigation_id,
            target_type="investigation",
        )
        return result
