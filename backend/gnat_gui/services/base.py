from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from gnat_gui.audit.events import AuditAction
from gnat_gui.audit.service import AuditService
from gnat_gui.rbac.permissions import Permission
from gnat_gui.rbac.service import RBACService

_rbac = RBACService()


class FacadeBase:
    """Shared RBAC/audit plumbing for domain facades.

    Every permission denial is recorded as an audit event and committed
    immediately — the request is about to fail with 403, and the session
    teardown rolls back on error, so the denial row must be durable before
    the exception propagates.
    """

    def __init__(self, db: Session, current_user: Any, audit: AuditService) -> None:
        self._db = db
        self._user = current_user
        self._audit = audit

    def _deny(self, permission: Permission) -> None:
        self._audit.record(
            AuditAction.PERMISSION_DENIED,
            user_id=self._user.id,
            username=self._user.username,
            target_id=str(permission),
            target_type="permission",
        )
        self._db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: {permission}",
        )

    def _check(self, permission: Permission) -> None:
        if not _rbac.has(self._user.permissions, permission):
            self._deny(permission)

    def _check_owned(
        self,
        owner_id: str | None,
        own_permission: Permission,
        any_permission: Permission,
    ) -> None:
        """Enforce the .own vs .any permission split against a resolved owner.

        Users holding the `.any` variant pass unconditionally. Users holding only
        the `.own` variant pass only when they own the resource. An unresolvable
        owner (None) is treated as not-owned — never fail open.
        """
        perms = self._user.permissions
        if _rbac.has(perms, any_permission):
            return
        if _rbac.has(perms, own_permission) and owner_id is not None and owner_id == self._user.id:
            return
        self._deny(own_permission if _rbac.has(perms, own_permission) else any_permission)
