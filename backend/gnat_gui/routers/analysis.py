from fastapi import APIRouter

from gnat_gui.deps import Audit, CurrentUser, DB
from gnat_gui.services.analysis_facade import AnalysisFacade

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


def _facade(db: DB, current_user: CurrentUser, audit: Audit) -> AnalysisFacade:
    return AnalysisFacade(db, current_user, audit)


@router.get("/investigations")
def list_investigations(
    db: DB, current_user: CurrentUser, audit: Audit,
    status: str | None = None, page: int = 1, page_size: int = 50,
):
    return _facade(db, current_user, audit).list_investigations(status=status, page=page, page_size=page_size)


@router.post("/investigations")
def create_investigation(body: dict, db: DB, current_user: CurrentUser, audit: Audit):
    return _facade(db, current_user, audit).create_investigation(body)


@router.get("/investigations/{investigation_id}")
def get_investigation(investigation_id: str, db: DB, current_user: CurrentUser, audit: Audit):
    return _facade(db, current_user, audit).get_investigation(investigation_id)


@router.patch("/investigations/{investigation_id}")
def update_investigation(investigation_id: str, body: dict, db: DB, current_user: CurrentUser, audit: Audit):
    return _facade(db, current_user, audit).update_investigation(investigation_id, body)


@router.delete("/investigations/{investigation_id}", status_code=204)
def delete_investigation(investigation_id: str, db: DB, current_user: CurrentUser, audit: Audit):
    _facade(db, current_user, audit).delete_investigation(investigation_id)


@router.post("/investigations/{investigation_id}/hypotheses")
def create_hypothesis(investigation_id: str, body: dict, db: DB, current_user: CurrentUser, audit: Audit):
    return _facade(db, current_user, audit).create_hypothesis(investigation_id, body)


@router.patch("/investigations/{investigation_id}/hypotheses/{hypothesis_id}")
def update_hypothesis(investigation_id: str, hypothesis_id: str, body: dict, db: DB, current_user: CurrentUser, audit: Audit):
    return _facade(db, current_user, audit).update_hypothesis(investigation_id, hypothesis_id, body)


@router.post("/investigations/{investigation_id}/notes")
def create_note(investigation_id: str, body: dict, db: DB, current_user: CurrentUser, audit: Audit):
    return _facade(db, current_user, audit).create_note(investigation_id, body)


@router.get("/investigations/{investigation_id}/timeline")
def get_timeline(investigation_id: str, db: DB, current_user: CurrentUser, audit: Audit):
    return _facade(db, current_user, audit).get_timeline(investigation_id)


@router.post("/investigations/{investigation_id}/gap-detection")
def submit_gap_detection(investigation_id: str, body: dict, db: DB, current_user: CurrentUser, audit: Audit):
    job_id = _facade(db, current_user, audit).submit_gap_detection(
        investigation_id, body.get("hypothesis")
    )
    return {"job_id": job_id}


@router.post("/investigations/{investigation_id}/draft-report")
def submit_draft_report(investigation_id: str, body: dict, db: DB, current_user: CurrentUser, audit: Audit):
    job_id = _facade(db, current_user, audit).submit_draft_report(
        investigation_id, body.get("report")
    )
    return {"job_id": job_id}
