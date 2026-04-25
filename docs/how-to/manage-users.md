# Manage users

This guide covers creating user accounts, assigning and changing roles, and deactivating accounts. All of these actions require the `admin` role.

---

## Create a user

### Via the admin UI

1. Log in as admin
2. Click **Admin** in the sidebar
3. Click **Users** in the admin sub-navigation
4. Click **New User**
5. Fill in:
   - **Username** — minimum 3 characters, maximum 128
   - **Password** — minimum 12 characters
   - **Role** — `viewer`, `analyst`, `senior_analyst`, or `admin`
6. Click **Create**

The user can log in immediately with the credentials you provided. You should share the password securely and ask them to change it on first login (password self-service is not yet implemented; an admin must update it via the API).

### Via the API

```bash
curl -X POST http://localhost:8000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token>" \
  --cookie "session=<your-session>" \
  -d '{
    "username": "alice",
    "password": "strongpassword42!",
    "role": "analyst"
  }'
```

See the [API reference](../reference/api-endpoints.md#admin) for the full schema.

---

## Change a user's role

### Via the admin UI

1. Navigate to **Admin → Users**
2. Click the row for the target user
3. Use the **Role** dropdown to select the new role
4. Click **Save**

### Via the API

```bash
curl -X PATCH http://localhost:8000/api/admin/users/<user-id> \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token>" \
  --cookie "session=<your-session>" \
  -d '{"role": "senior_analyst"}'
```

The role change takes effect on the user's next request (the session record itself does not need to be invalidated; permissions are re-checked on each request against the database).

---

## Deactivate a user

Deactivation blocks the user from logging in and invalidates all their existing sessions. Their data (investigations, rules) is not deleted.

### Via the admin UI

1. Navigate to **Admin → Users**
2. Click the row for the target user
3. Toggle the **Active** switch to off
4. Click **Save**

### Via the API

```bash
curl -X PATCH http://localhost:8000/api/admin/users/<user-id> \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token>" \
  --cookie "session=<your-session>" \
  -d '{"is_active": false}'
```

---

## Reactivate a user

Same as deactivation but set `is_active: true`. The user can log in again immediately.

---

## View the audit log

Every user-management action is recorded in the audit log. To review it:

1. Navigate to **Admin → Audit**
2. Use the date range and action-type filters to narrow results

Or query the API:

```bash
curl http://localhost:8000/api/admin/audit \
  --cookie "session=<your-session>"
```

See the [Audit events reference](../reference/audit-events.md) for all recordable action types.

---

## Role capabilities summary

For a full permission matrix see the [Permissions reference](../reference/permissions.md). The short version:

| Role | Investigations | Rules | Admin |
|---|---|---|---|
| viewer | Read own/any | Read | — |
| analyst | Create/edit/delete own | Create/edit/test own | — |
| senior_analyst | + Materialise, edit any | + Edit any, promote | — |
| admin | All | All | User management, audit log |
