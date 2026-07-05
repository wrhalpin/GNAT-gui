from fastapi import APIRouter

from gnat_gui.deps import DB, Audit, CurrentUser
from gnat_gui.services.rules_facade import RulesFacade

router = APIRouter(prefix="/api/rules", tags=["rules"])


def _facade(db: DB, current_user: CurrentUser, audit: Audit) -> RulesFacade:
    return RulesFacade(db, current_user, audit)


@router.get("")
def list_rules(
    db: DB,
    current_user: CurrentUser,
    audit: Audit,
    engine: str | None = None,
    scope: str | None = None,
    status: str | None = None,
):
    return _facade(db, current_user, audit).list_rules(engine=engine, scope=scope, status=status)


@router.post("")
def create_rule(body: dict, db: DB, current_user: CurrentUser, audit: Audit):
    return _facade(db, current_user, audit).create_rule(body)


@router.get("/{rule_id}")
def get_rule(rule_id: str, db: DB, current_user: CurrentUser, audit: Audit):
    return _facade(db, current_user, audit).get_rule(rule_id)


@router.put("/{rule_id}")
def update_rule(rule_id: str, body: dict, db: DB, current_user: CurrentUser, audit: Audit):
    return _facade(db, current_user, audit).update_rule(rule_id, body)


@router.delete("/{rule_id}", status_code=204)
def delete_rule(rule_id: str, db: DB, current_user: CurrentUser, audit: Audit):
    _facade(db, current_user, audit).delete_rule(rule_id)


@router.post("/{rule_id}/test")
def test_rule(rule_id: str, body: dict, db: DB, current_user: CurrentUser, audit: Audit):
    job_id = _facade(db, current_user, audit).submit_test(rule_id, body.get("fixture", {}))
    return {"job_id": job_id}


@router.get("/{rule_id}/audit-trail")
def get_audit_trail(rule_id: str, db: DB, current_user: CurrentUser, audit: Audit):
    return _facade(db, current_user, audit).get_audit_trail(rule_id)


@router.post("/{rule_id}/promote")
def promote_rule(rule_id: str, db: DB, current_user: CurrentUser, audit: Audit):
    return _facade(db, current_user, audit).promote_rule(rule_id)
