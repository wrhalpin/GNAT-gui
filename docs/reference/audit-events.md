# Audit events reference

Every state-changing action in GNAT-gui appends a record to the `audit_events` table. The audit log is read-only after creation; events cannot be edited or deleted.

---

## Auth events

| Action | Value | Triggered by |
|---|---|---|
| `LOGIN` | `auth.login` | Successful authentication via `POST /api/auth/login` |
| `LOGOUT` | `auth.logout` | `POST /api/auth/logout` |
| `LOGIN_FAILED` | `auth.login_failed` | Failed authentication attempt (wrong password or unknown user) |
| `PERMISSION_DENIED` | `auth.permission_denied` | Request rejected by RBAC check in the facade layer |

## Investigation events

| Action | Value | Triggered by |
|---|---|---|
| `INVESTIGATION_CREATED` | `investigation.created` | New investigation created in Analysis module |
| `INVESTIGATION_UPDATED` | `investigation.updated` | Investigation title, description, or status changed |
| `INVESTIGATION_DELETED` | `investigation.deleted` | Investigation deleted |
| `INVESTIGATION_MATERIALIZED` | `investigation.materialized` | Investigation graph written to GNAT workspace (senior_analyst+) |

## Hypothesis events

| Action | Value | Triggered by |
|---|---|---|
| `HYPOTHESIS_CREATED` | `hypothesis.created` | New hypothesis added to an investigation |
| `HYPOTHESIS_UPDATED` | `hypothesis.updated` | Hypothesis content or Admiralty score changed |

## Note events

| Action | Value | Triggered by |
|---|---|---|
| `NOTE_CREATED` | `note.created` | Note added to an investigation |

## Rule events

| Action | Value | Triggered by |
|---|---|---|
| `RULE_CREATED` | `rule.created` | New rule saved (any engine) |
| `RULE_UPDATED` | `rule.updated` | Rule body or metadata changed |
| `RULE_DELETED` | `rule.deleted` | Rule deleted |
| `RULE_TESTED` | `rule.tested` | Test runner job submitted for a rule |
| `RULE_PROMOTED` | `rule.promoted` | Rule status changed from `draft` to `active` (senior_analyst+) |

## Report events

| Action | Value | Triggered by |
|---|---|---|
| `REPORT_CREATED` | `report.created` | Report draft saved or generated |
| `REPORT_PUBLISHED` | `report.published` | Report published (senior_analyst+) |

## Admin events

| Action | Value | Triggered by |
|---|---|---|
| `USER_CREATED` | `admin.user_created` | New user account created by admin |
| `USER_UPDATED` | `admin.user_updated` | User role or active status changed by admin |
| `USER_DEACTIVATED` | `admin.user_deactivated` | User account deactivated by admin |

---

## Audit record schema

Each event record contains:

| Field | Type | Description |
|---|---|---|
| `id` | `str` (UUID) | Unique event ID |
| `user_id` | `str \| null` | ID of the user who triggered the event (null for system events) |
| `username` | `str \| null` | Username at the time of the event (denormalised for log readability) |
| `action` | `str` | One of the `AuditAction` values above |
| `target_id` | `str \| null` | ID of the affected resource (investigation, rule, user, …) |
| `target_type` | `str \| null` | Type of the affected resource |
| `source_ip` | `str \| null` | Client IP address |
| `timestamp` | `datetime` | UTC timestamp of the event |

---

## Querying the audit log

Admin users can query the log via `GET /api/admin/audit` with optional filters:

```
GET /api/admin/audit?action=rule.promoted&page=1&page_size=50
GET /api/admin/audit?user_id=<uuid>&after=2026-01-01T00:00:00Z
```

See the [API endpoints reference](api-endpoints.md#admin) for the full query parameter list.
