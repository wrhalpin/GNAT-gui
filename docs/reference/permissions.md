# Permissions reference

GNAT-gui uses a role-based access control (RBAC) system with four built-in roles. Permissions are checked at the facade layer on every state-changing operation.

---

## Roles

| Role | Intended for |
|---|---|
| `viewer` | Read-only stakeholders who need to review but not modify |
| `analyst` | Practising analysts who create and manage their own investigations and rules |
| `senior_analyst` | Senior staff who can materialise investigations, promote rules, and publish reports |
| `admin` | System administrators; all permissions plus user management and audit access |

---

## Permission matrix

A tick (✓) means the role has the permission. A dash (—) means it does not.

### Investigations

| Permission | viewer | analyst | senior_analyst | admin |
|---|:---:|:---:|:---:|:---:|
| `investigation.create` | — | ✓ | ✓ | ✓ |
| `investigation.read.own` | ✓ | ✓ | ✓ | ✓ |
| `investigation.read.any` | ✓ | ✓ | ✓ | ✓ |
| `investigation.update.own` | — | ✓ | ✓ | ✓ |
| `investigation.update.any` | — | — | ✓ | ✓ |
| `investigation.delete.own` | — | ✓ | ✓ | ✓ |
| `investigation.delete.any` | — | — | — | ✓ |
| `investigation.materialize` | — | — | ✓ | ✓ |

### Rules

| Permission | viewer | analyst | senior_analyst | admin |
|---|:---:|:---:|:---:|:---:|
| `rule.read` | ✓ | ✓ | ✓ | ✓ |
| `rule.create` | — | ✓ | ✓ | ✓ |
| `rule.update.own` | — | ✓ | ✓ | ✓ |
| `rule.update.any` | — | — | ✓ | ✓ |
| `rule.test` | — | ✓ | ✓ | ✓ |
| `rule.publish` | — | — | ✓ | ✓ |

### Reports

| Permission | viewer | analyst | senior_analyst | admin |
|---|:---:|:---:|:---:|:---:|
| `report.read` | ✓ | ✓ | ✓ | ✓ |
| `report.create` | — | ✓ | ✓ | ✓ |
| `report.publish` | — | — | ✓ | ✓ |

### Administration

| Permission | viewer | analyst | senior_analyst | admin |
|---|:---:|:---:|:---:|:---:|
| `audit.read` | — | — | — | ✓ |
| `admin.users` | — | — | — | ✓ |
| `admin.roles` | — | — | — | ✓ |

---

## How permissions are enforced

Permissions are checked in the **facade layer** (`gnat_gui/services/`), not in the router. Every facade method calls `RBACService.check(user, permission)` before calling the GNAT core service. If the user lacks the required permission, a 403 response is returned immediately and a `auth.permission_denied` audit event is recorded.

The `admin` role receives all permissions automatically (the `ROLE_PERMISSIONS` dict assigns `[p for p in Permission]`).

---

## Checking permissions in the frontend

The `usePermission` hook returns `true` if the currently authenticated user has a given permission:

```typescript
import { usePermission } from "@/lib/rbac";

function MaterialiseButton() {
  const canMaterialise = usePermission("investigation.materialize");
  if (!canMaterialise) return null;
  return <button>Materialise</button>;
}
```

The permission list is returned from `GET /api/auth/me` and cached by TanStack Query.

> **Security note:** Frontend permission checks are for UX only (hiding buttons). All enforcement happens server-side in the facade. Never rely on the frontend to prevent unauthorised access.
