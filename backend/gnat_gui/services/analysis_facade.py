from typing import Any

from gnat_gui.audit.events import AuditAction
from gnat_gui.db.models.investigation_owner import InvestigationOwner
from gnat_gui.rbac.permissions import Permission
from gnat_gui.services.base import FacadeBase


class AnalysisFacade(FacadeBase):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self._svc = self._load_service()

    def _load_service(self) -> Any:
        from gnat.analyst_services.analysis import AnalysisService  # type: ignore[import]

        return AnalysisService()

    def _owner_of(self, investigation_id: str) -> str | None:
        """Resolve an investigation's owner: GUI ownership record first, then the
        owner_id GNAT core stored at creation time."""
        row = (
            self._db.query(InvestigationOwner)
            .filter_by(investigation_id=investigation_id)
            .first()
        )
        if row:
            return row.owner_id
        try:
            obj = self._svc.get_investigation(investigation_id)
        except Exception:
            return None
        return getattr(obj, "owner_id", None)

    def list_investigations(
        self, status: str | None = None, page: int = 1, page_size: int = 50
    ) -> Any:
        self._check(Permission.INVESTIGATION_READ_OWN)
        return self._svc.list_investigations(
            owner_id=self._user.id, status=status, page=page, page_size=page_size
        )

    def get_investigation(self, investigation_id: str) -> Any:
        self._check(Permission.INVESTIGATION_READ_OWN)
        return self._svc.get_investigation(investigation_id)

    def create_investigation(self, data: dict) -> Any:
        self._check(Permission.INVESTIGATION_CREATE)
        result = self._svc.create_investigation(data, owner_id=self._user.id)
        self._db.add(
            InvestigationOwner(investigation_id=result.id, owner_id=self._user.id)
        )
        self._audit.record(
            AuditAction.INVESTIGATION_CREATED,
            user_id=self._user.id,
            username=self._user.username,
            target_id=result.id,
            target_type="investigation",
        )
        return result

    def update_investigation(self, investigation_id: str, data: dict) -> Any:
        self._check_owned(
            self._owner_of(investigation_id),
            Permission.INVESTIGATION_UPDATE_OWN,
            Permission.INVESTIGATION_UPDATE_ANY,
        )
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
        self._check_owned(
            self._owner_of(investigation_id),
            Permission.INVESTIGATION_DELETE_OWN,
            Permission.INVESTIGATION_DELETE_ANY,
        )
        self._svc.delete_investigation(investigation_id)
        self._db.query(InvestigationOwner).filter_by(
            investigation_id=investigation_id
        ).delete()
        self._audit.record(
            AuditAction.INVESTIGATION_DELETED,
            user_id=self._user.id,
            username=self._user.username,
            target_id=investigation_id,
            target_type="investigation",
        )

    def create_hypothesis(self, investigation_id: str, data: dict) -> Any:
        self._check_owned(
            self._owner_of(investigation_id),
            Permission.INVESTIGATION_UPDATE_OWN,
            Permission.INVESTIGATION_UPDATE_ANY,
        )
        result = self._svc.create_hypothesis(investigation_id, data)
        self._audit.record(
            AuditAction.HYPOTHESIS_CREATED,
            user_id=self._user.id,
            username=self._user.username,
            target_id=result.id,
            target_type="hypothesis",
        )
        return result

    def update_hypothesis(
        self, investigation_id: str, hypothesis_id: str, data: dict
    ) -> Any:
        self._check_owned(
            self._owner_of(investigation_id),
            Permission.INVESTIGATION_UPDATE_OWN,
            Permission.INVESTIGATION_UPDATE_ANY,
        )
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
        self._check_owned(
            self._owner_of(investigation_id),
            Permission.INVESTIGATION_UPDATE_OWN,
            Permission.INVESTIGATION_UPDATE_ANY,
        )
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
        self._check(Permission.INVESTIGATION_READ_OWN)
        return self._svc.get_timeline(investigation_id)

    def submit_gap_detection(self, investigation_id: str, hypothesis: Any) -> str:
        self._check(Permission.INVESTIGATION_READ_OWN)
        from gnat.jobs import JobRunner  # type: ignore[import]
        from gnat.jobs.store import JobStore  # type: ignore[import]

        runner = JobRunner(JobStore())
        job = runner.submit(
            "gap_detection",
            submitted_by=self._user.id,
            request_payload={
                "investigation_id": investigation_id,
                "hypothesis": hypothesis,
            },
        )
        self._audit.record(
            AuditAction.GAP_DETECTION_RUN,
            user_id=self._user.id,
            username=self._user.username,
            target_id=investigation_id,
            target_type="investigation",
        )
        return job.id

    def submit_draft_report(self, investigation_id: str, report: Any) -> str:
        self._check(Permission.REPORT_CREATE)
        from gnat.jobs import JobRunner  # type: ignore[import]
        from gnat.jobs.store import JobStore  # type: ignore[import]

        runner = JobRunner(JobStore())
        job = runner.submit(
            "report_draft",
            submitted_by=self._user.id,
            request_payload={"investigation_id": investigation_id, "report": report},
        )
        self._audit.record(
            AuditAction.REPORT_CREATED,
            user_id=self._user.id,
            username=self._user.username,
            target_id=investigation_id,
            target_type="investigation",
        )
        return job.id
