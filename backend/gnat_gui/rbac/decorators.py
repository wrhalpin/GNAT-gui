from collections.abc import Callable
from typing import Any

from fastapi import Depends

from gnat_gui.deps import get_current_user
from gnat_gui.rbac.permissions import Permission
from gnat_gui.rbac.service import RBACService

_rbac = RBACService()


def require_permission(permission: Permission) -> Callable[..., Any]:
    def dependency(current_user: Any = Depends(get_current_user)) -> Any:
        _rbac.check(current_user.permissions, permission)
        return current_user

    return Depends(dependency)
