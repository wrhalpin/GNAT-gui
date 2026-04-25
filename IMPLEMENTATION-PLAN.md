# GNAT-gui Implementation Plan

**Branch:** `claude/review-plan-file-J9IDm`
**Based on:** `GNAT-gui-plan.md` (sanity-checked against `wrhalpin/GNAT` main, 2026-04-25)

---

## Sanity Check Results

Plan passes. All referenced GNAT core surfaces are confirmed present on main:

| Claim | Status |
|---|---|
| `gnat.analyst_services` (analysis, investigations, rules, reporting) | ✓ |
| `gnat.schemas` (analysis, auth, investigations, reporting, rules) | ✓ |
| `gnat.jobs` (runner, store, registry, models, decorators) | ✓ |
| `gnat.streaming` (ProgressEvent, TokenEvent, ResultEvent, ErrorEvent) | ✓ |
| `gnat.investigations.builder` — `build_with_progress(callback)` | ✓ |
| `gnat.analysis.copilot.GapDetector` — `detect_with_progress(callback)` | ✓ |
| `gnat.analysis.copilot.ReportDraftingAssistant` — LLM-backed | ✓ |
| 159 connectors, 26 predicates, 3 rule engines, STIX 2.1 ORM | ✓ |
| FastAPI ≥0.111, SQLAlchemy ≥2.0, Pydantic ≥2.0 | ✓ |
| `gnat/serve/`, `gnat/dissemination/`, `gnat/tui/` staying as-is | ✓ |

**Two clarifications for implementers (not errors in the plan):**

1. **GapDetector is rule-based, not LLM.** The plan's streaming section says "LLM gap detection." GapDetector uses 8 predefined rules and a progress callback — no tokens. Wrap it in a `gnat.jobs` handler and the SSE bridge emits `ProgressEvent` + `ResultEvent`. Token streaming (`TokenEvent`) applies only to `ReportDraftingAssistant`.

2. **Python 3.11+ is correct for GNAT-gui.** GNAT core's `pyproject.toml` still reads `>=3.9` but the real 3.9 constraint is a Docker base image concern in core, not a library constraint. 3.11+ is the right target for a new app.

---

## SSE Bridge Pattern

`gnat.jobs.JobRunner` is synchronous (ThreadPoolExecutor). The GUI backend bridges job callbacks → SSE like this:

```python
# backend/gnat_gui/routers/jobs.py
@router.get("/api/jobs/{job_id}/stream")
async def stream_job(job_id: str, store: JobStore = Depends(get_job_store)):
    async def event_generator():
        last_seen = 0
        while True:
            job = store.get(job_id)
            new_events = job.events[last_seen:]
            for evt in new_events:
                yield f"data: {json.dumps(evt.to_dict())}\n\n"
                last_seen += 1
            if job.is_terminal:
                yield f"data: {json.dumps({'type': 'done', 'status': job.status.value})}\n\n"
                break
            await asyncio.sleep(0.25)
    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

Job handlers call `progress_cb(float, message)` which the runner stores as `ProgressEvent` objects on the `Job`. Terminal state stores a `ResultEvent` or `ErrorEvent`. Frontend polls SSE until `done`.

---

## M0 — Foundations (Week 1–2)

**Goal:** Authenticated user can log in, see empty dashboard, log out. Admin can create users via API.

### Files to create

```
backend/
  pyproject.toml                         # gnat-gui-backend package
  alembic.ini
  alembic/env.py
  alembic/versions/                      # (empty, first migration generated)
  gnat_gui/
    __init__.py
    main.py                              # create_app() factory
    config.py                            # Settings(BaseSettings)
    deps.py                              # get_db, get_current_user, get_job_store
    db/
      base.py
      session.py
      models/
        user.py                          # User, hashed_password, role FK
        session.py                       # Session, token, expires_at, revoked
        role.py                          # Role, permissions JSON column
        audit.py                         # AuditEvent, append-only
        ui_state.py
        investigation_owner.py
    auth/
      service.py                         # login(), logout(), get_session()
      password.py                        # hash_password(), verify_password()
      middleware.py                      # session cookie extraction
    rbac/
      permissions.py                     # Permission constants as StrEnum
      service.py                         # RBACService.check(user, permission)
      decorators.py                      # require_permission dependency
    audit/
      events.py
      service.py                         # AuditService.record(...)
    routers/
      auth.py                            # POST /api/auth/login, /logout, GET /me
      admin.py                           # POST /api/admin/users, GET /api/admin/audit
    schemas/
      auth.py                            # LoginRequest, SessionResponse, MeResponse
      admin.py                           # UserCreate, UserResponse, AuditEventResponse
scripts/
  seed.py                                # default roles + admin user
frontend/
  package.json
  tsconfig.json
  vite.config.ts
  tailwind.config.ts
  components.json
  src/
    main.tsx
    app.tsx
    router.tsx
    api/client.ts                        # fetch wrapper, 401 → redirect to login
    components/
      ui/                                # shadcn install target
      layout/Shell.tsx
      layout/Sidebar.tsx
      auth/LoginForm.tsx
    pages/login.tsx
    pages/dashboard.tsx
    lib/auth.ts                          # useSession hook
```

### Key contracts

**`POST /api/auth/login`**
```
Request:  { username: string, password: string }
Response: { user_id, username, role, expires_at }
Set-Cookie: session=<token>; HttpOnly; Secure; SameSite=Lax
```

**`GET /api/auth/me`**
```
Response: { user_id, username, role, permissions: string[] }
```

**`POST /api/admin/users`** (admin only)
```
Request:  { username, password, role }
Response: { user_id, username, role, created_at }
```

### Alembic baseline

Generate first migration after models are written:
```
alembic revision --autogenerate -m "baseline_gui_db"
alembic upgrade head
```

### Tests (M0)

- `tests/unit/auth/test_password.py` — hash/verify roundtrip
- `tests/unit/auth/test_service.py` — login success, wrong password, expired session
- `tests/unit/rbac/test_service.py` — each role gets correct permissions
- `tests/integration/test_auth_flow.py` — login → /me → logout → /me returns 401
- `tests/integration/test_admin_users.py` — admin creates user, non-admin gets 403

### M0 gate check

```bash
# start backend
uvicorn gnat_gui.main:app --reload

# seed
python scripts/seed.py

# login
curl -c cookies.txt -X POST /api/auth/login -d '{"username":"admin","password":"changeme"}'
curl -b cookies.txt /api/auth/me
# → returns role: admin

# start frontend
cd frontend && npm run dev
# → login page renders, login succeeds, dashboard shows, logout works
```

---

## M1 — Analysis Module (Week 3–5)

**Goal:** Analyst can create investigation, add hypotheses with Admiralty scoring, write notes, view timeline.

### New files

```
backend/gnat_gui/
  routers/analysis.py
  services/analysis_facade.py
  schemas/                               # (add to existing)
    analysis.py                          # thin wrappers; domain shapes come from gnat.schemas

frontend/src/
  api/queries/analysis.ts
  components/analysis/
    investigation-list.tsx
    investigation-detail.tsx
    hypothesis-card.tsx
    confidence-badge.tsx
    tlp-marking.tsx
    timeline-view.tsx
  pages/analysis/
    index.tsx                            # investigation list
    [id].tsx                             # investigation detail
```

### Facade pattern

```python
# analysis_facade.py
class AnalysisFacade:
    def __init__(self, db, current_user, audit):
        self._svc = gnat.analyst_services.analysis.AnalysisService(...)
        self._audit = audit
        self._user = current_user

    def list_investigations(self, filters) -> list[Investigation]:
        self._rbac.check(self._user, Permission.INVESTIGATION_READ)
        return self._svc.list_investigations(owner=self._user.id, **filters)

    def create_investigation(self, data) -> Investigation:
        self._rbac.check(self._user, Permission.INVESTIGATION_CREATE)
        result = self._svc.create(data, owner=self._user.id)
        self._audit.record(AuditEvent.INVESTIGATION_CREATED, target=result.id)
        return result
```

Every facade method: check RBAC → call core service → record audit → return schema.

### Key routes

```
GET    /api/analysis/investigations
POST   /api/analysis/investigations
GET    /api/analysis/investigations/{id}
PATCH  /api/analysis/investigations/{id}
DELETE /api/analysis/investigations/{id}      # senior_analyst+

POST   /api/analysis/investigations/{id}/hypotheses
PATCH  /api/analysis/investigations/{id}/hypotheses/{hyp_id}

POST   /api/analysis/investigations/{id}/notes
GET    /api/analysis/investigations/{id}/timeline
```

### Tests (M1)

- Unit: `analysis_facade` with mocked `gnat.analyst_services`
- Unit: every router with mocked facade
- Integration: full create → add hypothesis → add note → fetch timeline flow
- E2E (Playwright): analyst login → create investigation → add hypothesis → verify Admiralty badge renders

---

## M2 — Rules Builder Module (Week 6–8)

**Goal:** Analyst authors a YAML rule via form builder, switches to Monaco, tests against fixture, sees audit trail.

### New files

```
backend/gnat_gui/
  routers/rules.py
  services/rules_facade.py

frontend/src/
  api/queries/rules.ts
  components/rules/
    rule-list.tsx
    rule-editor.tsx                      # Monaco wrapper
    predicate-palette.tsx                # 26 predicates, click-to-insert
    yaml-form-builder.tsx
    test-runner-panel.tsx
    audit-trail.tsx
  lib/monaco/
    hy-lang.ts                           # syntax highlighting + paren matching
    yaml-dsl-lang.ts                     # schema-validated against rule spec
    prolog-lang.ts
  pages/rules/
    index.tsx
    [id].tsx
```

### Key routes

```
GET    /api/rules
POST   /api/rules
GET    /api/rules/{id}
PUT    /api/rules/{id}
DELETE /api/rules/{id}
POST   /api/rules/{id}/test              # returns job_id
GET    /api/rules/{id}/audit-trail
POST   /api/rules/{id}/promote          # senior_analyst only
```

### Test runner flow

`POST /api/rules/{id}/test` with `{ fixture: EvidenceJSON }`:
1. Facade calls `gnat.analyst_services.rules.RulesService.test_rule(rule, fixture)`
2. Returns `{ job_id }` immediately
3. Frontend opens SSE to `/api/jobs/{job_id}/stream`
4. Job handler emits `ProgressEvent` per rule step, `ResultEvent` with firing/non-firing + audit trail

### Tests (M2)

- Unit: rules_facade with mocked core
- Unit: Monaco language definitions (token types)
- Integration: create rule → test → fetch audit trail
- E2E: create YAML rule via form builder → switch to Monaco → run test fixture → view result

---

## M3 — Investigations Module (Week 9–12)

**Goal:** Analyst picks seed, watches 5-step pipeline via SSE, expands nodes, filters edges, senior_analyst materializes.

### New files

```
backend/gnat_gui/
  routers/investigations.py
  routers/jobs.py                        # /api/jobs/{id}/stream SSE endpoint
  services/investigations_facade.py
  streaming/sse.py                       # SSE bridge (see pattern above)

frontend/src/
  api/queries/investigations.ts
  lib/sse.ts                             # EventSource wrapper
  components/investigations/
    seed-picker.tsx
    graph-canvas.tsx                     # React Flow, dagre layout
    node-detail-drawer.tsx
    edge-filter.tsx
    correlation-legend.tsx
    materialize-action.tsx
  pages/investigations/
    index.tsx
    new.tsx                              # seed picker
    [id].tsx                             # graph canvas
```

### Pipeline job handler

```python
# registered in gnat_gui at startup
from gnat.jobs import job
from gnat.investigations.builder import InvestigationBuilder

@job("build_investigation")
def build_investigation_job(payload, progress_cb, cancel):
    builder = InvestigationBuilder(
        seeds=payload["seeds"],
        config=get_gnat_config(),
    )
    result = builder.build_with_progress(
        lambda p, msg: progress_cb(p, msg)
    )
    return result.to_dict()
```

Frontend SSE receives `ProgressEvent` at each of the 5 builder checkpoints (0.0, 0.1, 0.5, 0.8, 0.95, 1.0), then a `ResultEvent` with the graph.

### Key routes

```
POST   /api/investigations                    # submit build job → { job_id }
GET    /api/investigations/{id}
GET    /api/investigations/{id}/graph
POST   /api/investigations/{id}/expand        # expand a node → { job_id }
POST   /api/investigations/{id}/materialize   # senior_analyst only
GET    /api/jobs/{job_id}/stream              # SSE
GET    /api/jobs/{job_id}                     # poll fallback
```

### Tests (M3)

- Unit: SSE bridge emits correct events for each job state transition
- Unit: investigations_facade
- Integration: submit build → poll to completion → fetch graph
- E2E: pick seed → watch progress bar fill → graph renders → expand node → filter edges

---

## M4 — LLM-backed Features (Week 13–14)

**Goal:** Gap detection and report drafting work end-to-end with streaming progress.

### Gap detection

GapDetector is **rule-based** (8 predefined rules). Wrap in a job:

```python
@job("gap_detection")
def gap_detection_job(payload, progress_cb, cancel):
    from gnat.analysis.copilot import GapDetector
    detector = GapDetector()
    gaps = detector.detect_with_progress(
        hypothesis=payload["hypothesis"],
        investigation=payload["investigation"],
        progress_callback=lambda p, msg: progress_cb(p, msg),
    )
    return {"gaps": [g.to_dict() for g in gaps]}
```

SSE stream emits `ProgressEvent` during detection, `ResultEvent` with gap list at end. **No token streaming** — detection is synchronous and fast; progress events are coarse checkpoints.

### Report drafting

`ReportDraftingAssistant` IS LLM-backed. If core exposes a streaming draft method, use `TokenEvent` to forward tokens to the frontend as they arrive. Otherwise call `draft_full()` synchronously inside the job and return a `ResultEvent`. Implement whichever the core service exposes:

```python
@job("report_draft")
def report_draft_job(payload, progress_cb, cancel):
    from gnat.analysis.copilot.drafting import ReportDraftingAssistant
    assistant = ReportDraftingAssistant(llm_client=get_llm_client())
    result = assistant.draft_full(payload["report"])
    return result.to_dict()
```

Frontend gap detector panel and report drafting assistant both open SSE connections to `/api/jobs/{job_id}/stream`.

### New routes

```
POST   /api/analysis/investigations/{id}/gap-detection    # → { job_id }
POST   /api/analysis/investigations/{id}/draft-report     # → { job_id }
```

### Tests (M4)

- Unit: gap_detection_job handler with mocked GapDetector
- Unit: report_draft_job handler with mocked ReportDraftingAssistant
- Integration: submit gap detection → poll to done → assert gap list in result
- E2E: run gap detector on an investigation → results panel populates

---

## M5 — Hardening & v1.0.0 (Week 15–16)

### Checklist

**Admin UI**
- `pages/admin/users.tsx` — list, create, edit role, deactivate
- `pages/admin/audit.tsx` — paginated audit log, filter by user/action/date, JSON export

**Performance targets**
- Graph canvas: 1000+ nodes at 60fps (React Flow virtualization + node memoization)
- Rule list: 500+ rules with TanStack Table virtual rows
- Investigation list: server-side pagination, cursor-based

**Security review gates**
- Auth: session fixation, CSRF on all state-changing routes, rate limit on `/api/auth/login`
- RBAC: fuzz each endpoint with each role, assert no privilege escalation
- Audit: assert every state-changing route produces an audit event
- Input: Pydantic strict mode on all request bodies

**CI gates before tagging v1.0.0**
- Backend coverage ≥ 75% (gate), target 80%
- Frontend coverage target 70%
- All E2E suites green
- Bandit + CodeQL clean
- Bundle size check passes

**Release steps**
1. `CHANGELOG.md` entry for v1.0.0
2. `git tag v1.0.0`
3. Release workflow builds wheel + SPA bundle + GHCR images
4. GitHub Release with attached artifacts

---

## Dependency Matrix

| Milestone | Depends on |
|---|---|
| M0 | Nothing — pure scaffold |
| M1 | M0 complete; `gnat.analyst_services.analysis` |
| M2 | M0 complete; `gnat.analyst_services.rules` |
| M3 | M0 complete; `gnat.jobs`; `gnat.investigations.builder` |
| M4 | M3 complete (SSE bridge); `gnat.jobs`; `gnat.analysis.copilot.*` |
| M5 | M1–M4 complete |

M1 and M2 can run in parallel after M0. M3 can also start in parallel with M1/M2 once M0 is done.

---

## Type Generation Workflow

Run after any Pydantic model change:

```bash
# scripts/generate-types.sh
uvicorn gnat_gui.main:app &
sleep 2
curl http://localhost:8000/openapi.json > /tmp/openapi.json
npx openapi-typescript /tmp/openapi.json -o frontend/src/api/generated.ts
kill %1
```

Wire as:
- Pre-commit hook
- First step of `frontend-test` CI workflow
- `npm run dev` startup (via `concurrently` in `package.json`)

---

## Local Dev Quickstart (target state)

```bash
# GNAT core — editable install during dev
pip install -e ../GNAT

# Backend
cd backend && pip install -e ".[dev]"
alembic upgrade head
python ../scripts/seed.py
uvicorn gnat_gui.main:app --reload &

# Frontend
cd ../frontend && npm install
npm run dev
```

Or with Docker:
```bash
docker compose -f docker-compose.dev.yml up
```
