from typing import Any

from gnat_gui.audit.events import AuditAction
from gnat_gui.db.models.investigation_owner import InvestigationOwner
from gnat_gui.rbac.permissions import Permission
from gnat_gui.services.base import FacadeBase


class InvestigationsFacade(FacadeBase):
    def _get_runner(self) -> tuple[Any, Any]:
        from gnat.jobs import JobRunner  # type: ignore[import]
        from gnat.jobs.store import JobStore  # type: ignore[import]

        store = JobStore()
        return JobRunner(store), store

    def _owner_of(self, investigation_id: str) -> str | None:
        row = (
            self._db.query(InvestigationOwner)
            .filter_by(investigation_id=investigation_id)
            .first()
        )
        if row:
            return row.owner_id
        try:
            from gnat.analyst_services.investigations import InvestigationsService  # type: ignore[import]

            obj = InvestigationsService().get_investigation(investigation_id)
        except Exception:
            return None
        return getattr(obj, "owner_id", None)

    def submit_build(self, seeds: list[dict]) -> str:
        self._check(Permission.INVESTIGATION_CREATE)
        runner, _ = self._get_runner()
        job = runner.submit(
            "build_investigation",
            submitted_by=self._user.id,
            request_payload={"seeds": seeds},
        )
        # NOTE: the investigation id only exists once the async build finishes, so
        # the GUI-side InvestigationOwner row cannot be written here. Ownership for
        # built investigations resolves via the owner_id GNAT core stores (the
        # _owner_of fallback); a completion hook can add the GUI record later.
        return job.id

    def get_graph(self, investigation_id: str) -> Any:
        self._check(Permission.INVESTIGATION_READ_OWN)
        from gnat.analyst_services.investigations import InvestigationsService  # type: ignore[import]

        return InvestigationsService().get_graph(investigation_id)

    def submit_expand(self, investigation_id: str, node_id: str) -> str:
        self._check_owned(
            self._owner_of(investigation_id),
            Permission.INVESTIGATION_UPDATE_OWN,
            Permission.INVESTIGATION_UPDATE_ANY,
        )
        runner, _ = self._get_runner()
        job = runner.submit(
            "expand_node",
            submitted_by=self._user.id,
            request_payload={"investigation_id": investigation_id, "node_id": node_id},
        )
        return job.id

    def materialize(self, investigation_id: str) -> Any:
        self._check(Permission.INVESTIGATION_MATERIALIZE)
        from gnat.analyst_services.investigations import InvestigationsService  # type: ignore[import]

        result = InvestigationsService().materialize(investigation_id)
        self._audit.record(
            AuditAction.INVESTIGATION_MATERIALIZED,
            user_id=self._user.id,
            username=self._user.username,
            target_id=investigation_id,
            target_type="investigation",
        )
        return result
