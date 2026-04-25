# Architecture overview

This document describes the overall system structure, how the components fit together, and how a request moves through the system from browser to GNAT core and back.

---

## System overview

```
┌─────────────────────────────────────────────────┐
│  Browser                                        │
│  React SPA (Vite/TanStack/React Flow/Monaco)    │
└───────────────────┬─────────────────────────────┘
                    │ HTTP / SSE
                    ▼
┌─────────────────────────────────────────────────┐
│  Nginx (production)                             │
│  /api  →  FastAPI backend                       │
│  /     →  compiled React assets                 │
└──────┬──────────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────┐
│  FastAPI application (uvicorn)                  │
│                                                 │
│  Routers → Facades → gnat.analyst_services.*    │
│                    ↘                            │
│              gnat.jobs (ThreadPoolExecutor)     │
│                    ↓                            │
│              gnat.investigations.*              │
│              gnat.analysis.*                    │
│              gnat.rules.*                       │
└──────┬──────────────────────────────────────────┘
       │
┌──────▼─────────────────┐  ┌─────────────────────┐
│  GUI database          │  │  GNAT core database  │
│  (PostgreSQL)          │  │  (PostgreSQL/SQLite) │
│                        │  │                      │
│  users, sessions,      │  │  investigations,     │
│  roles, audit,         │  │  STIX objects,       │
│  ui_state,             │  │  rules, reports      │
│  investigation_owner   │  │                      │
└────────────────────────┘  └─────────────────────┘
```

---

## The two databases

GNAT-gui maintains a strict boundary between its own operational data and the GNAT domain data. See [Two-database model](two-database-model.md) for a full discussion.

**GUI database** — owned and migrated by GNAT-gui (Alembic):
- User accounts, hashed passwords
- Session tokens
- Role and permission assignments
- Append-only audit log
- UI preferences (layout, recent items)
- Investigation ownership/sharing metadata

**GNAT core database** — owned by GNAT core (never touched by GNAT-gui migrations):
- All STIX 2.1 objects (SDOs and SROs)
- Investigation graphs
- Detection rules and rule versions
- Analysis results and reports

---

## Request lifecycle

A typical read request (e.g. `GET /api/analysis/investigations`) flows:

1. **Browser** — TanStack Query fires a fetch to `/api/analysis/investigations`
2. **Nginx** — proxies to FastAPI on port 8000
3. **FastAPI middleware** — CSRF check, session cookie validated via `get_current_user` dependency
4. **Router function** (`routers/analysis.py`) — receives validated request, creates facade
5. **Facade** (`services/analysis_facade.py`) — checks RBAC, calls `gnat.analyst_services.analysis.list_investigations(user_id=...)`
6. **GNAT core** — queries the GNAT database, returns Python domain objects
7. **Facade** — maps to Pydantic response schema, records audit event
8. **Router** — returns Pydantic model; FastAPI serialises to JSON
9. **Browser** — TanStack Query caches the response and re-renders

A long-running operation (e.g. `POST /api/investigations/build`) follows the same path through step 5, then:

5. **Facade** — submits a `gnat.jobs` job, receives `job_id` immediately
6. **Facade** — returns `{ job_id }` to the router (no blocking)
7. **Browser** — receives `job_id`, opens SSE stream at `/api/jobs/{job_id}/stream`
8. **SSE bridge** (`streaming/sse.py`) — polls `JobStore` every 250 ms, emits events as they arrive
9. **Browser** — receives progress events and updates the UI in real time

---

## Layer responsibilities

| Layer | File(s) | Responsible for |
|---|---|---|
| Router | `routers/*.py` | HTTP binding only — parameter extraction, response serialisation, no logic |
| Facade | `services/*_facade.py` | RBAC check, GNAT core call, audit record, schema conversion |
| GNAT core | `gnat.*` | All intelligence analysis domain logic |
| Schema | `schemas/*.py` | Request/response validation (Pydantic, strict mode) |
| Deps | `deps.py` | Session resolution, DB session, audit service injection |
| Middleware | `main.py` | CSRF, CORS, rate limiting |

---

## Frontend architecture

The React SPA uses a file-based routing structure via TanStack Router. Each page component follows the same pattern:

- **Data fetching** — TanStack Query hooks defined in `api/queries/`
- **Permission checks** — `usePermission()` from `lib/rbac.ts` (UI gating only; backend enforces)
- **UI state** — Zustand store in `stores/ui.ts` for layout preferences, panel widths, collapsed sections
- **Streaming** — `openJobStream()` from `lib/sse.ts` for any operation that returns a `job_id`

Type safety across the API boundary is maintained by generating `src/api/generated.ts` from the backend's `/openapi.json` using `openapi-typescript`. This runs automatically on `npm run dev`.

---

## Deployment topology

In production (Docker Compose):

```
internet → Nginx (port 443/80) → backend (port 8000, internal)
                               → static files (React build, internal)
```

In development:

```
browser → Vite dev server (port 5173)
              Vite proxy /api → uvicorn (port 8000)
```

The Vite proxy means the frontend dev server and backend can be started independently and the browser always talks to `localhost:5173`.
