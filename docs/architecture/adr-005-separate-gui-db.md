# ADR-005: Separate GUI database

**Status:** Accepted

## Context

GNAT core has its own SQLAlchemy database (InvestigationStore, ReportStore, workspace tables). GNAT-gui needs to store additional data: user accounts, sessions, RBAC roles, audit log, UI preferences.

## Decision

GNAT-gui maintains its own PostgreSQL database, managed with Alembic migrations, separate from the GNAT core database.

## Rationale

- GNAT core DB schema is owned by the core team; GNAT-gui should not add tables to it
- Separation of concerns: GUI concerns (who is logged in, what layout does this analyst prefer) are not domain concerns
- Independent migration lifecycle: GNAT-gui can add a new UI preference column without coordinating with a core DB migration
- Security: the GUI DB stores hashed passwords and session tokens; keeping it separate limits blast radius if either DB is compromised

## Data ownership boundary

| Data | Stored in |
|------|-----------|
| User accounts, sessions, roles | GUI DB |
| Audit log of GUI actions | GUI DB |
| UI preferences, saved layouts | GUI DB |
| Investigation ownership/sharing metadata | GUI DB |
| Investigation content, hypotheses, evidence | GNAT core DB (via `gnat.analyst_services`) |
| Rules, reports, STIX objects | GNAT core DB (via `gnat.analyst_services`) |

## Consequences

- Two databases to operate and back up
- Investigation ownership in the GUI DB references investigation IDs from the core DB by foreign key convention (no enforced FK across DBs)
- Alembic migrations in `backend/alembic/` only touch the GUI DB
