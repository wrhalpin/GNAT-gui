from fastapi import HTTPException, status

from gnat_gui.rbac.permissions import Permission


class RBACService:
    def check(self, user_permissions: list[str], permission: Permission) -> None:
        if permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission}",
            )

    def has(self, user_permissions: list[str], permission: Permission) -> bool:
        return permission in user_permissions
