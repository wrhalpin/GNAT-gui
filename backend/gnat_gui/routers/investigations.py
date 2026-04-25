from fastapi import APIRouter

from gnat_gui.deps import Audit, CurrentUser, DB
from gnat_gui.services.investigations_facade import InvestigationsFacade

router = APIRouter(prefix="/api/investigations", tags=["investigations"])


def _facade(db: DB, current_user: CurrentUser, audit: Audit) -> InvestigationsFacade:
    return InvestigationsFacade(db, current_user, audit)


@router.post("")
def submit_build(body: dict, db: DB, current_user: CurrentUser, audit: Audit):
    job_id = _facade(db, current_user, audit).submit_build(body.get("seeds", []))
    return {"job_id": job_id}


@router.get("/{investigation_id}/graph")
def get_graph(investigation_id: str, db: DB, current_user: CurrentUser, audit: Audit):
    return _facade(db, current_user, audit).get_graph(investigation_id)


@router.post("/{investigation_id}/expand")
def expand_node(investigation_id: str, body: dict, db: DB, current_user: CurrentUser, audit: Audit):
    job_id = _facade(db, current_user, audit).submit_expand(investigation_id, body["node_id"])
    return {"job_id": job_id}


@router.post("/{investigation_id}/materialize")
def materialize(investigation_id: str, db: DB, current_user: CurrentUser, audit: Audit):
    return _facade(db, current_user, audit).materialize(investigation_id)
