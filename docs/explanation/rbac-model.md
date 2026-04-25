# RBAC model

This document explains the design of GNAT-gui's role-based access control system: how roles and permissions are defined, where enforcement happens, how the frontend reflects permissions, and how the audit log ties into the whole picture.

---

## Design goals

1. **Simple roles, fine-grained permissions** — operators assign one of four named roles; permissions are derived from the role automatically
2. **Server-side enforcement at every state change** — the frontend hides UI elements but never trusts the absence of a button to be a security boundary
3. **Audit every permission denial** — unauthorised access attempts are logged, not silently dropped

---

## Roles

Four roles are seeded by `scripts/seed.py` and stored in the GUI database `roles` table. Each row carries a `permissions` JSON array.

| Role | Designed for |
|---|---|
| `viewer` | Read-only stakeholders |
| `analyst` | Practising analysts (create and manage own work) |
| `senior_analyst` | Leads who can promote, materialise, and publish |
| `admin` | System administrators (all permissions + user management) |

Custom roles are not currently supported; the permission set is fixed at startup.

---

## Permissions

Permissions are `StrEnum` values defined in `gnat_gui/rbac/permissions.py`. They follow the pattern `<resource>.<action>[.<scope>]`:

```python
Permission.INVESTIGATION_CREATE       # investigation.create
Permission.INVESTIGATION_UPDATE_OWN   # investigation.update.own
Permission.INVESTIGATION_UPDATE_ANY   # investigation.update.any
Permission.RULE_PUBLISH               # rule.publish
Permission.ADMIN_USERS                # admin.users
```

The `.own` / `.any` distinction allows analysts to modify their own objects without being able to modify peers' work. Senior analysts and admins receive the `.any` variant.

See the [Permissions reference](../reference/permissions.md) for the full matrix.

---

## Enforcement point: the facade

Every facade method begins with an RBAC check:

```python
# services/analysis_facade.py
def delete_investigation(self, investigation_id: str, user) -> None:
    # Check permission first — no business logic runs if this raises
    if investigation.owner_id == user.id:
        self.rbac.check(user, Permission.INVESTIGATION_DELETE_OWN)
    else:
        self.rbac.check(user, Permission.INVESTIGATION_DELETE_ANY)

    # Only reaches here if permission is granted
    gnat_analysis.delete(investigation_id)

    self.audit.record(AuditAction.INVESTIGATION_DELETED, user_id=user.id, ...)
```

`RBACService.check()` raises `HTTPException(403)` if the user lacks the permission. The 403 is returned immediately; no further code executes.

**Why the facade, not the router?** The facade is tested independently of FastAPI's request machinery. This makes it straightforward to write unit tests that assert permission boundaries without spinning up an HTTP server.

---

## Permission check implementation

```python
# rbac/service.py
class RBACService:
    def check(self, user, permission: Permission) -> None:
        if permission not in user.role.permissions:
            self.audit.record(
                AuditAction.PERMISSION_DENIED,
                user_id=user.id,
                target_type="permission",
                target_id=permission,
            )
            raise HTTPException(status_code=403, detail="Forbidden")
```

Every denial is logged as a `auth.permission_denied` audit event before the exception is raised.

---

## Session and permission resolution

The `get_current_user` FastAPI dependency (in `deps.py`) resolves the session cookie to a `User` ORM object with an eagerly loaded `Role`. The role's `permissions` list is a Python `list[str]` stored as a JSON column in the `roles` table. This means:

- No per-request database join beyond the session lookup (the role is joined once)
- Role permission changes take effect on the next request (no cache to invalidate)

---

## Frontend reflection

`GET /api/auth/me` returns the full permission list for the authenticated user. TanStack Query caches this. The `usePermission(permission)` hook reads from this cache:

```typescript
export function usePermission(permission: string): boolean {
  const { data } = useMe();
  return data?.permissions.includes(permission) ?? false;
}
```

This is used to conditionally render UI elements (hide the Promote button for analysts, hide the Admin nav link for non-admins). It is **not** a security boundary — the server rejects unauthorised requests regardless.

---

## Audit integration

The audit log is directly coupled to RBAC enforcement:

- Every permission **denial** records `auth.permission_denied` (in `RBACService.check`)
- Every successful state-changing action records an action-specific event (in the facade, after the core call succeeds)
- Failed logins record `auth.login_failed` (in `AuthService.login`)

This means the audit log captures both attempted unauthorised access and successful actions, giving administrators a complete picture.

---

## Extension points

To add a new permission:

1. Add a new `Permission` value in `rbac/permissions.py`
2. Add it to the appropriate roles in `ROLE_PERMISSIONS`
3. Re-run `scripts/seed.py` to update the seeded roles (or write a data migration if needed in production)
4. Call `self.rbac.check(user, Permission.NEW_PERMISSION)` in the relevant facade method

No other changes are required — the permission propagates to the frontend via `/api/auth/me` automatically.
