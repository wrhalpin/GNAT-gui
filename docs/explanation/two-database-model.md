# Two-database model

GNAT-gui uses two separate databases and never touches the GNAT core database with its own migrations. This document explains what lives where, why the boundary exists, and what it means in practice.

---

## What lives where

### GUI database (owned by GNAT-gui)

Managed by Alembic migrations in `backend/alembic/`. Contains everything the GUI needs to operate that is *not* intelligence data:

| Table | Contents |
|---|---|
| `users` | Usernames, hashed passwords, active flag, role FK |
| `sessions` | Session tokens, expiry, revocation flag |
| `roles` | Role names, permissions JSON array |
| `audit_events` | Append-only log of all state changes |
| `ui_state` | Per-user UI preferences (panel widths, collapsed sections, recent items) |
| `investigation_owner` | GUI-side ownership and sharing metadata for investigations |

### GNAT core database (owned by GNAT core)

Never modified by GNAT-gui migrations. Contains all intelligence domain data:

| Domain | Contents |
|---|---|
| Investigations | Evidence graphs, pipeline run history |
| STIX objects | All SDOs (indicators, malware, threat actors, …) and SROs (relationships) |
| Rules | Rule bodies, version history, test results |
| Reports | Report drafts and published versions |
| Analysis | Hypotheses, notes, Admiralty scores, gap detection results |

---

## Why not one database?

### 1. The GUI is an optional layer

GNAT core is a standalone headless library. Organisations can run it with a CLI, with other frontends, or without any GUI at all. Merging GUI schema into GNAT's database would couple the core to a specific UI, making it harder to upgrade GNAT independently.

### 2. Independent migration lifecycles

GNAT core manages its own schema evolution. GNAT-gui manages its own. If they shared a database, every upgrade of either component would need to coordinate migrations with the other. By keeping them separate, each can evolve and be deployed independently.

### 3. Separation of concerns in data access

GUI data (user accounts, sessions, RBAC) needs different access patterns and security properties than domain data (STIX objects, rule bodies). For example:

- The GUI database needs to be backed up for business continuity (user accounts and audit log)
- The GNAT core database might be reconstructed from raw intelligence feeds

### 4. GNAT core is a Python library, not a service

Because GNAT is imported directly (not called over HTTP), it manages its own database connection internally. The GUI does not have the option of "sharing a connection pool" — the two databases are managed by entirely separate SQLAlchemy engines.

---

## `investigation_owner`: the join point

The one point where the two databases conceptually overlap is investigation ownership. Investigations are created and stored in the GNAT core database, but the GUI needs to track who owns them (for `.own` vs `.any` RBAC checks) and who has shared access.

The `investigation_owner` table in the GUI database holds `(investigation_id, user_id, role)` rows that reference investigation IDs in the GNAT core database by string ID only (no foreign key constraint across databases). This is an intentional denormalisation:

- If an investigation is deleted from the GNAT core, the corresponding rows in `investigation_owner` become orphaned. A background cleanup task (not yet implemented) should periodically reconcile these.
- The `investigation_id` is a STIX bundle UUID; collisions are astronomically unlikely.

---

## Migration strategy

GNAT-gui uses Alembic against the GUI database exclusively. The `alembic/env.py` imports all GUI ORM models (`gnat_gui.db.models.*`) for autogenerate.

Never import GNAT core models in the Alembic env — doing so would attempt to autogenerate migrations for GNAT's schema, which would be incorrect and destructive.

---

## Configuring both databases

The GUI database URL is set via `GNAT_GUI_DB_URL`. The GNAT core database is configured via `GNAT_GUI_GNAT_CONFIG_PATH`, which points to GNAT's own configuration file. GNAT resolves its own database URL from that file.

In development both databases default to local PostgreSQL. In production they may be the same PostgreSQL instance (different databases) or entirely different servers — GNAT-gui does not care.
