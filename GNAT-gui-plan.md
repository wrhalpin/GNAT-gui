# GNAT-gui Repo Plan

**Repo:** `wrhalpin/GNAT-gui` (to be created)
**Companion plan:** `gnat_core_changes_plan.md`
**Status:** Draft for review
**Owner:** @wrhalpin

-----

## Purpose

A standalone web application providing a graphical interface to GNAT for analyst-facing workflows. Initial scope covers the Analysis, Rules Builder, and Investigations modules. Named `GNAT-gui` (not `GNAT-analyst`) because the same app is the natural home for future non-analyst surfaces — admin/tenant management, scheduler dashboards, connector health, report viewers — that don’t fit cleanly into the existing thin `gnat/serve/` FastAPI dashboard.

GNAT core stays a headless library with CLI/TUI/REST surfaces. GNAT-gui imports `gnat` as a library dependency and adds a FastAPI backend plus a React frontend on top.

-----

## Architecture Summary

```
┌────────────────────────────────────────────────────────────────┐
│                    Browser (React SPA)                         │
│  TanStack Query · React Flow · Monaco · TanStack Table         │
└────────────────────────────┬───────────────────────────────────┘
                             │ HTTPS (httpOnly session cookie)
                             │ + SSE for streaming jobs
┌────────────────────────────▼───────────────────────────────────┐
│              GNAT-gui Backend (FastAPI)                        │
│  Routers:  /api/auth /api/analysis /api/rules                  │
│            /api/investigations /api/jobs /api/admin            │
│  Services: AuthService · RBACService · AuditService            │
│            (thin wrappers around gnat.analyst_services.*)      │
│  Storage:  GUI DB (SQLAlchemy) — users, sessions, prefs,       │
│            audit log, RBAC, UI state                           │
└────────────────────────────┬───────────────────────────────────┘
                             │ Python imports
┌────────────────────────────▼───────────────────────────────────┐
│                  gnat (pip dependency, pinned)                 │
│  gnat.analyst_services · gnat.schemas · gnat.jobs              │
│  gnat.analysis · gnat.investigations · gnat.reporting          │
│  gnat.clients (159 connectors) · STIX 2.1 ORM                  │
└────────────────────────────┬───────────────────────────────────┘
                             │
┌────────────────────────────▼───────────────────────────────────┐
│              GNAT Core DB (existing SQLAlchemy stores)         │
│  InvestigationStore · ReportStore · workspace tables           │
└────────────────────────────────────────────────────────────────┘
```

Two databases: GNAT’s existing core DB (untouched), and GNAT-gui’s own DB for app-only concerns (auth, sessions, RBAC, audit, UI prefs). The backend imports core services in-process for analysis/investigations/rules data.

-----

## Repo Layout

Monorepo with backend and frontend at the root. Single git history, independent deploy artifacts.

```
GNAT-gui/
├── README.md
├── CLAUDE.md                     # Claude Code context for this repo
├── LICENSE                       # Apache 2.0 (matches GNAT)
├── CHANGELOG.md
├── CONTRIBUTING.md
├── SECURITY.md
├── .github/
│   ├── workflows/
│   │   ├── backend-test.yml      # Ruff, mypy, pytest, Bandit
│   │   ├── backend-codeql.yml
│   │   ├── frontend-test.yml     # ESLint, TypeScript check, Vitest, Playwright
│   │   ├── e2e.yml               # Full stack docker compose + Playwright
│   │   └── release.yml           # Build wheel + SPA bundle, tag, GHCR image
│   ├── dependabot.yml
│   └── ISSUE_TEMPLATE/
├── docker/
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile       # nginx serving SPA build
│   └── docker-compose.yml        # backend + frontend + postgres + gnat-core link
├── docker-compose.dev.yml        # Hot-reload dev stack
├── docs/
│   ├── architecture/
│   │   ├── adr-001-monorepo.md
│   │   ├── adr-002-fastapi-not-pyramid.md
│   │   ├── adr-003-import-not-rest.md
│   │   ├── adr-004-react-stack.md
│   │   └── adr-005-separate-gui-db.md
│   ├── deployment.md
│   ├── auth-and-rbac.md
│   └── module-specs/
│       ├── analysis.md
│       ├── rules-builder.md
│       └── investigations.md
├── backend/
│   ├── pyproject.toml            # gnat-gui-backend package
│   ├── alembic.ini
│   ├── alembic/
│   │   └── versions/             # GUI DB migrations only
│   ├── gnat_gui/
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI app factory
│   │   ├── config.py             # Pydantic Settings (env-driven)
│   │   ├── deps.py               # FastAPI dependencies (auth, db, gnat client)
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── base.py           # SQLAlchemy declarative base
│   │   │   ├── session.py        # Engine + sessionmaker
│   │   │   └── models/
│   │   │       ├── user.py
│   │   │       ├── session.py
│   │   │       ├── role.py
│   │   │       ├── audit.py
│   │   │       ├── ui_state.py   # Saved layouts, recent items, prefs
│   │   │       └── investigation_owner.py  # GUI-side ownership/sharing
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   ├── service.py        # AuthService — login, session, logout
│   │   │   ├── password.py       # argon2-cffi wrapper
│   │   │   ├── api_key.py        # API key issuance/verification (admin-only)
│   │   │   ├── oidc.py           # v1 — Authlib OIDC integration
│   │   │   └── middleware.py     # Session cookie middleware, CSRF
│   │   ├── rbac/
│   │   │   ├── __init__.py
│   │   │   ├── service.py        # RBACService — role/permission checks
│   │   │   ├── permissions.py    # Permission constants
│   │   │   └── decorators.py     # @require_permission FastAPI dependency
│   │   ├── audit/
│   │   │   ├── __init__.py
│   │   │   ├── service.py        # AuditService — append-only log
│   │   │   └── events.py         # Audit event types
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py           # /api/auth/login, /logout, /me
│   │   │   ├── admin.py          # /api/admin/users, /roles, /audit
│   │   │   ├── analysis.py       # /api/analysis/* (investigations CRUD, hypotheses, notes)
│   │   │   ├── rules.py          # /api/rules/* (rule files, validation, test runs)
│   │   │   ├── investigations.py # /api/investigations/* (graph build, expand, materialize)
│   │   │   ├── jobs.py           # /api/jobs/* (status polling + SSE stream)
│   │   │   └── prefs.py          # /api/prefs/* (UI state, saved views)
│   │   ├── services/             # Backend-only orchestration over gnat.analyst_services
│   │   │   ├── __init__.py
│   │   │   ├── analysis_facade.py
│   │   │   ├── rules_facade.py
│   │   │   └── investigations_facade.py
│   │   ├── schemas/              # Request/response models specific to this app
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── admin.py
│   │   │   └── ui.py             # UI state schemas; domain schemas come from gnat.schemas
│   │   └── streaming/
│   │       ├── __init__.py
│   │       └── sse.py            # SSE response helpers + job event bridge
│   └── tests/
│       ├── conftest.py
│       ├── unit/
│       │   ├── auth/
│       │   ├── rbac/
│       │   └── routers/
│       └── integration/
│           ├── test_analysis_flow.py
│           ├── test_rules_flow.py
│           └── test_investigations_flow.py
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── tailwind.config.ts
│   ├── components.json           # shadcn/ui config
│   ├── playwright.config.ts
│   ├── src/
│   │   ├── main.tsx
│   │   ├── app.tsx
│   │   ├── router.tsx            # TanStack Router
│   │   ├── api/
│   │   │   ├── client.ts         # fetch wrapper with auth handling
│   │   │   ├── generated.ts      # openapi-typescript output (gitignored, built at start)
│   │   │   └── queries/          # TanStack Query hooks per domain
│   │   ├── components/
│   │   │   ├── ui/               # shadcn primitives
│   │   │   ├── layout/           # Shell, sidebar, breadcrumbs
│   │   │   ├── auth/
│   │   │   ├── analysis/
│   │   │   │   ├── investigation-list.tsx
│   │   │   │   ├── investigation-detail.tsx
│   │   │   │   ├── hypothesis-card.tsx
│   │   │   │   ├── confidence-badge.tsx
│   │   │   │   ├── tlp-marking.tsx
│   │   │   │   └── timeline-view.tsx
│   │   │   ├── rules/
│   │   │   │   ├── rule-list.tsx
│   │   │   │   ├── rule-editor.tsx          # Monaco wrapper
│   │   │   │   ├── predicate-palette.tsx    # 26 helper predicates with insert
│   │   │   │   ├── yaml-form-builder.tsx    # Visual builder for YAML DSL
│   │   │   │   ├── test-runner-panel.tsx
│   │   │   │   └── audit-trail.tsx
│   │   │   └── investigations/
│   │   │       ├── seed-picker.tsx
│   │   │       ├── graph-canvas.tsx         # React Flow wrapper
│   │   │       ├── node-detail-drawer.tsx
│   │   │       ├── edge-filter.tsx
│   │   │       ├── correlation-legend.tsx
│   │   │       └── materialize-action.tsx
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── auth.ts
│   │   │   ├── rbac.ts
│   │   │   ├── sse.ts            # EventSource wrapper for job streaming
│   │   │   └── monaco/           # Hy, YAML DSL, Prolog language definitions
│   │   ├── pages/
│   │   │   ├── login.tsx
│   │   │   ├── dashboard.tsx
│   │   │   ├── analysis/
│   │   │   ├── rules/
│   │   │   ├── investigations/
│   │   │   └── admin/
│   │   ├── stores/               # Zustand — UI-only state (panel layout, etc.)
│   │   └── styles/
│   ├── public/
│   └── tests/
│       ├── unit/                 # Vitest + React Testing Library
│       └── e2e/                  # Playwright
├── scripts/
│   ├── generate-types.sh         # Runs backend → exports OpenAPI → openapi-typescript
│   ├── dev.sh                    # Starts backend + frontend dev servers
│   └── seed.py                   # Seed default roles, admin user
└── pyproject.toml                # Workspace root (optional, for uv/rye/poetry)
```

-----

## Backend Detail

### Stack

- Python 3.11+ (matches GNAT supported range)
- FastAPI 0.110+
- SQLAlchemy 2.x (async support, matches GNAT)
- Alembic for GUI DB migrations
- Pydantic v2 (matches GNAT)
- argon2-cffi for password hashing
- Authlib for OIDC (v1)
- starlette-csrf for CSRF on cookie-auth routes
- slowapi for rate limiting
- structlog for structured logging
- gnat (pinned to a release tag, e.g. `gnat==X.Y.Z`)

### Dependency on GNAT core

Backend imports `gnat` as a library. Required core surfaces (delivered per the core changes plan):

- `gnat.schemas.*` — Pydantic models for all domain objects (request/response)
- `gnat.analyst_services.*` — thin service wrappers exposing UI-friendly methods
- `gnat.jobs` — long-running job framework with progress events
- Streaming hooks in `gnat.investigations.builder` and `gnat.analysis.copilot.*`

If GNAT core delivers schemas and services slowly, the backend can stub the gaps locally and migrate when core ships them — but the goal is to have core be the source of truth for all domain shapes.

### Backend services (facades)

Each module gets a facade that:

1. Loads the current user and checks RBAC permissions
1. Resolves any GUI-DB context (ownership, prefs, audit metadata)
1. Calls into `gnat.analyst_services.*`
1. Records audit events
1. Returns Pydantic models from `gnat.schemas.*` (FastAPI serializes to JSON automatically)

This pattern keeps router code thin, makes RBAC + audit consistent, and isolates GUI concerns from core domain logic.

### Auth model

**v0 (initial):**

- Local username/password with argon2 hashing
- Session cookie (httpOnly, Secure, SameSite=Lax) with server-side session table in GUI DB
- CSRF token on state-changing requests
- Rate-limited login endpoint
- Bootstrap admin user via `seed.py`

**v1 (post-launch):**

- OIDC integration via Authlib (Okta, Entra ID, Google, generic)
- Optional API keys for programmatic access (admin-issued, scoped to a user)
- Optional MFA (TOTP first, WebAuthn later)

### RBAC model

Roles (seeded):

|Role            |Permissions                                                                                                    |
|----------------|---------------------------------------------------------------------------------------------------------------|
|`viewer`        |Read-only access to all modules; no investigations created                                                     |
|`analyst`       |Full CRUD on own investigations, read others’ (if shared); rule editing in personal scope; full Analysis access|
|`senior_analyst`|All analyst perms + promote rules to shared scope, materialize investigations to STIX, publish reports         |
|`admin`         |All perms + user/role management, audit log access, system config                                              |

Permissions are fine-grained (e.g. `investigation.create`, `investigation.read.own`, `investigation.read.any`, `rule.publish`, `audit.read`). Roles bundle permissions. Implementation uses a permission registry + FastAPI dependency.

### Audit log

Append-only table in GUI DB. Every state-changing action writes an audit event with: user, timestamp, action type, target object ID, before/after diff (where applicable), source IP, request ID. Read-restricted to admin role. Exports to JSON for compliance.

Audit covers: login/logout, permission denials, investigation lifecycle changes, rule edits/promotions, report publishing, materializations, admin actions.

### Streaming

Long-running operations return a job ID immediately. Frontend opens an SSE connection to `/api/jobs/{job_id}/stream` to receive progress events. Operations supported initially:

- Investigation builder pipeline (5 steps with per-step progress)
- LLM gap detection (token-by-token streaming if core supports)
- Report drafting assistant (section-by-section)
- Bulk rule test runs

Job state is persisted in GUI DB so reconnects work after browser refresh.

-----

## Frontend Detail

### Stack

- React 18 + TypeScript 5
- Vite (dev server + build)
- TanStack Router (file-based routing, type-safe)
- TanStack Query (server state)
- TanStack Table (analyst tables)
- Tailwind CSS + shadcn/ui (component primitives)
- React Flow (investigations graph)
- Monaco Editor (rules editor)
- Recharts (timeline + analytics charts)
- Zustand (client-only UI state, e.g. panel layout)
- Zod (runtime validation of API responses against generated types)
- Vitest + React Testing Library (unit)
- Playwright (e2e)
- openapi-typescript (type generation from backend OpenAPI)

### Type generation flow

1. Backend exposes OpenAPI at `/openapi.json`
1. `scripts/generate-types.sh` fetches it and runs `openapi-typescript` to produce `frontend/src/api/generated.ts`
1. TanStack Query hooks import types from generated module
1. Run on backend startup in dev (via concurrently), in CI before frontend tests, and as a pre-commit hook

End-to-end: change a Pydantic model in `gnat.schemas` → backend reload → regenerate TS types → frontend type errors surface immediately.

### Module-by-module UI

#### Analysis module

- **Investigation list page**: TanStack Table, filterable by status (OPEN/IN_PROGRESS/REVIEW/CLOSED), owner, tag. Bulk actions for senior_analyst+.
- **Investigation detail page**: header with state machine + transitions, hypothesis cards with Admiralty Scale badges, notes pane (markdown), tasks list, evidence summary linking to investigation graph view.
- **Hypothesis editor**: form-driven, with confidence score picker (Admiralty Scale + numeric), supporting/refuting evidence references, timeline integration.
- **Notes**: markdown editor with TLP marking selector and analyst attribution.
- **Timeline view**: Recharts horizontal timeline of evidence events, filterable by source platform and TLP.
- **Gap detector**: invoke `gnat.analysis.copilot.GapDetector` via job; results stream into a side panel as they arrive.
- **Report drafting**: invoke `ReportDraftingAssistant` via job; rendered Markdown editor for analyst revision before promotion to the reporting layer.

#### Rules Builder module

- **Rule list**: filterable by engine (Hy / YAML / Prolog), scope (personal / team / shared), status, target hypothesis.
- **Rule editor**: tabbed Monaco editor with custom language modes:
  - Hy/Lisp: syntax highlighting, paren matching, basic autocomplete
  - YAML DSL: schema-validated against the rule engine spec, with a visual form builder mode toggle
  - Prolog: syntax highlighting, helper predicate autocomplete
- **Predicate palette**: side panel listing the 26 helper predicates with descriptions, signatures, and examples; click to insert at cursor.
- **Test runner panel**: load a fixture (or paste evidence JSON), run the rule, see firing/non-firing with the audit trail visualization showing first-match, priority, and AI-60 ceiling.
- **Audit trail viewer**: read-only display of why a rule fired or didn’t fire on a given evidence set.
- **Promotion workflow**: senior_analyst can promote a personal rule to shared scope; goes through a review state with audit trail.

#### Investigations module

- **Seed picker page**: form to start a new investigation. Seed types: indicator, threat actor, campaign, custom STIX object. Multi-seed support.
- **Graph canvas**: React Flow with custom node types per STIX object type, edge styling by relationship type, edge thickness/color by correlation confidence. Layout via dagre or elkjs.
- **Node detail drawer**: opens on node click; shows full STIX object, source platform, timeline of observations, related nodes, expand actions.
- **Expand actions**: pivot from a node to fetch related objects from configured platforms; results merged into the graph live via SSE.
- **Edge filter**: toggle edge types (uses, indicates, attributed-to, etc.) and confidence threshold.
- **Five-step pipeline view**: progress indicator showing seed → expand → normalize → correlate → materialize, with per-step duration and result counts. Streamed via SSE during build.
- **Materialize action**: senior_analyst can materialize the graph into a GNAT workspace as STIX; shows preview diff, requires explicit confirmation, recorded in audit log.

### State management

- **Server state**: TanStack Query for everything. Aggressive cache invalidation on mutations.
- **Client state**: Zustand for layout (panel widths, collapsed sections), recent items, draft buffers.
- **URL state**: TanStack Router for filters, selected investigation, graph view position. Sharing a URL = sharing a view.

### Accessibility

- WCAG 2.1 AA target
- All interactive elements keyboard-navigable
- Focus-visible styling
- Screen reader testing on critical paths (login, investigation list, rule editor)
- shadcn/ui components are Radix-based which gives a11y out of the box

-----

## Deployment

### Production target

Docker compose initially, mapping to the same patterns as GNAT’s existing stack:

```yaml
services:
  gnat-gui-backend:    # FastAPI, uvicorn workers
    image: ghcr.io/wrhalpin/gnat-gui-backend:VERSION
    depends_on: [postgres, gnat-core-db]
    environment:
      - GNAT_GUI_DB_URL=...
      - GNAT_CONFIG=...        # Reuses GNAT's existing config file
      - SESSION_SECRET=...
      - OIDC_ISSUER=...        # v1
  gnat-gui-frontend:   # nginx serving SPA bundle
    image: ghcr.io/wrhalpin/gnat-gui-frontend:VERSION
    ports: ["443:443"]
    # Terminates TLS, proxies /api/* to backend
  postgres:            # GUI DB
    image: postgres:16
    volumes: ["gnat-gui-pgdata:/var/lib/postgresql/data"]
```

### Single-binary alternative

For smaller deployments, the SPA can be built and served as static files from the FastAPI app itself (mount on `/`). Simpler but couples deploy of frontend and backend. Document both options.

### Reverse proxy

Default deployment expects nginx or Caddy in front for TLS. The frontend container ships with nginx for convenience but doesn’t terminate TLS itself — that’s the operator’s choice. Documented patterns for nginx, Caddy, and Traefik.

### Configuration

- All config via env vars (12-factor)
- Pydantic Settings with strict validation at startup
- Sensitive values via Docker secrets or env (no INI checked into images)
- Reuses GNAT’s existing config file for connector access (read-only to backend)

-----

## CI/CD

### Backend pipeline

Mirrors GNAT’s existing GitHub Actions structure:

|Workflow      |Trigger |Steps                                                       |
|--------------|--------|------------------------------------------------------------|
|backend-test  |push, PR|Ruff lint+format, mypy, pytest with coverage, fail under 75%|
|backend-bandit|push, PR|Bandit security scan                                        |
|backend-codeql|push, PR|CodeQL Python analysis                                      |
|backend-deps  |PR      |Dependency review action                                    |

### Frontend pipeline

|Workflow       |Trigger |Steps                                         |
|---------------|--------|----------------------------------------------|
|frontend-test  |push, PR|ESLint, TypeScript check, Vitest with coverage|
|frontend-build |push, PR|Vite production build, bundle size check      |
|frontend-codeql|push, PR|CodeQL JavaScript/TypeScript analysis         |

### E2E pipeline

|Workflow|Trigger         |Steps                                                                   |
|--------|----------------|------------------------------------------------------------------------|
|e2e     |PR, nightly main|docker compose up full stack, Playwright suite, upload traces on failure|

### Release pipeline

On version tag (`v*`):

1. Build backend wheel
1. Build frontend production bundle
1. Build & push backend Docker image to GHCR
1. Build & push frontend Docker image to GHCR
1. Generate release notes from CHANGELOG
1. Create GitHub Release with attached artifacts

-----

## Testing Strategy

### Backend

- **Unit tests**: every service method, every router with mocked dependencies. Target 80% coverage minimum, 75% gate in CI.
- **Integration tests**: real GUI Postgres, mocked or local GNAT, full router-to-service-to-DB flow per module.
- **Contract tests**: assert that backend Pydantic schemas match `gnat.schemas` exports byte-for-byte (catches drift when GNAT releases new versions).

### Frontend

- **Unit tests**: components in isolation with React Testing Library, hook tests for TanStack Query wrappers.
- **Component tests**: full page renders with mocked API.
- **Type tests**: TypeScript compile-time checks ensure generated types match usage.

### E2E

- **Smoke**: login → list investigations → open one → log out
- **Analysis path**: create investigation, add hypothesis, run gap detector, draft report
- **Rules path**: create YAML rule via form builder, switch to Monaco, run test fixture, view audit trail
- **Investigations path**: pick seed, build graph, expand a node, filter edges, materialize to workspace
- **RBAC**: viewer cannot mutate, analyst cannot materialize, admin can manage users
- **Audit**: every state-changing action produces a log entry visible to admin

-----

## Build Order and Milestones

Single-track development; all three modules ship in v1.0.0 per the scoping decision. Sequence within v1 development:

### M0 — Foundations (week 1–2)

- Repo scaffold (backend + frontend skeletons)
- CI pipelines (skeleton, will fill out)
- Backend: app factory, config, GUI DB models for users/sessions/roles/audit, Alembic baseline
- Backend: auth (login/logout/me), RBAC dependency, audit service
- Frontend: scaffold, login page, protected route shell, layout components, shadcn install
- Decision: GNAT core dependency strategy (pinned tag or local editable install during early dev)

**Gate**: an authenticated user can log in, see an empty dashboard, log out. Admin can create users via API.

### M1 — Analysis module (week 3–5)

- Backend: `/api/analysis/*` router and `analysis_facade`
- Frontend: investigation list, detail, hypothesis editor, notes, timeline view
- Tests: unit + integration + e2e smoke for analysis flow

**Gate**: an analyst can create an investigation, add hypotheses with Admiralty scoring, write notes, view the timeline.

### M2 — Rules Builder module (week 6–8)

- Backend: `/api/rules/*` router and `rules_facade`, including test runner endpoint
- Frontend: rule list, Monaco editor with three language modes, predicate palette, YAML form builder, test runner panel, audit trail
- Tests: unit + integration + e2e for create/edit/test flow

**Gate**: an analyst can author a YAML rule via the form builder, switch to Monaco for fine-tuning, test it against a fixture, see the audit trail.

### M3 — Investigations module (week 9–12)

- Backend: `/api/investigations/*` router, `investigations_facade`, SSE streaming for builder pipeline
- Frontend: seed picker, React Flow graph canvas, node detail drawer, edge filter, expand actions, materialize action
- Tests: unit + integration + e2e for end-to-end investigation flow

**Gate**: an analyst can pick a seed, watch the five-step pipeline build the graph, expand nodes, filter edges, and (with senior_analyst role) materialize to a workspace.

### M4 — LLM-backed features (week 13–14)

- Backend: integrate `gnat.jobs` framework for gap detection and report drafting; SSE wiring
- Frontend: gap detector panel, report drafting assistant
- Requires GNAT core changes plan stream 3 (job framework) to be merged

**Gate**: gap detection and report drafting both work end-to-end with streaming progress.

### M5 — Hardening and v1.0.0 release (week 15–16)

- Audit log UI for admins
- User/role management UI
- Documentation pass (deployment, ops, user guide)
- Performance pass (graph rendering with 1000+ nodes, rule lists with 500+ rules)
- Security review (auth flows, CSRF, RBAC bypass attempts, audit completeness)
- Release: tag v1.0.0, publish images, write release notes

**Gate**: ready for production deployment in a small environment.

### Post-v1 backlog

- v1.1: OIDC/SSO via Authlib
- v1.2: Saved views and shared dashboards
- v1.3: Connector health dashboard, scheduler view, report viewer (the non-analyst surfaces that motivated the `-gui` name)
- v1.4: Mobile-responsive layout for read-only analyst review
- v1.5: WebSocket live updates for shared investigations (multiple analysts viewing same graph)
- v2.0: Plugin model for custom analyst widgets

-----

## Open Questions

1. **GNAT core release cadence vs GUI release cadence**. If GNAT pushes breaking changes, GUI must pin and test before bumping. Need a contract testing approach (covered above) plus a version compatibility matrix in the GUI README.
1. **Local dev story for GNAT-gui changes that need GNAT core changes**. Recommendation: editable install of GNAT during dev (`pip install -e ../GNAT`), pinned release in CI/prod. Document this in CONTRIBUTING.md.
1. **iPad-friendliness**. The `-gui` name implies broader use; the React Flow + Monaco combo is desktop-class. Mobile review-only mode is probably v1.4.
1. **Single-tenant vs multi-tenant**. GNAT core supports multi-tenant workspaces. Should GNAT-gui surface tenant selection in v1, or assume single-tenant deployments and add it later? Recommendation: tenant selector hidden behind a config flag for v1, fully exposed in v1.3 alongside admin UI.
1. **Headless/API-only mode**. Should the backend be runnable without the frontend (i.e. a separate API service that other tools could consume)? Recommendation: yes, the backend is already an HTTP service — document how to run it standalone, but don’t make it a primary use case.

-----

## Cross-References

- Companion plan for changes required in `wrhalpin/GNAT`: `gnat_core_changes_plan.md`
- GNAT existing FastAPI dashboard: `gnat/serve/` — stays as-is, not replaced by GNAT-gui
- GNAT REST gateway: `gnat/dissemination/api/` — stays as-is, public API surface
- GNAT TUI: `gnat/tui/` — stays as-is, SSH-friendly alternative