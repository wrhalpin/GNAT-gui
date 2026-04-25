# GNAT-gui

Web application providing a graphical interface to GNAT for analyst-facing workflows.

## Architecture

- **Frontend**: React 18 + TypeScript, Vite, TanStack Router/Query/Table, React Flow, Monaco, Tailwind + shadcn/ui
- **Backend**: FastAPI 0.111+, SQLAlchemy 2.x, Pydantic v2, argon2-cffi auth, gnat.jobs for async work
- **GNAT core**: imported as a Python library (`gnat`). Editable install during dev: `pip install -e ../GNAT`

## Repo layout

```
backend/         FastAPI app (gnat_gui package)
frontend/        React SPA
scripts/         seed.py, generate-types.mjs, dev.sh
docker/          Dockerfiles + nginx.conf
.github/         CI/CD workflows
```

## Dev quickstart

```bash
# Backend (from repo root)
cd backend && pip install -e ".[dev]"
alembic upgrade head
python ../scripts/seed.py          # creates roles + admin user
uvicorn gnat_gui.main:app --reload

# Frontend (new terminal)
cd frontend && npm install
npm run dev                        # proxies /api to localhost:8000
```

Or with Docker:
```bash
docker compose -f docker-compose.dev.yml up
```

## Key patterns

**Facade pattern**: every domain router delegates to a facade in `gnat_gui/services/`. Facade checks RBAC, calls `gnat.analyst_services.*`, records audit event, returns schema.

**Job streaming**: long-running ops submit a `gnat.jobs` job and return `{ job_id }`. Frontend opens SSE at `/api/jobs/{job_id}/stream`. The SSE bridge in `gnat_gui/streaming/sse.py` polls `gnat.jobs.JobStore` and emits `gnat.streaming` event types.

**Type generation**: `scripts/generate-types.mjs` fetches `/openapi.json` from the running backend and writes `frontend/src/api/generated.ts`. Run after any Pydantic model change.

## RBAC roles

| Role | Key permissions |
|---|---|
| viewer | read-only everywhere |
| analyst | full CRUD on own investigations, rule create/edit/test |
| senior_analyst | + materialize, rule promote, report publish |
| admin | all + user management, audit log |

## Testing

```bash
# Backend
cd backend && pytest

# Frontend
cd frontend && npm test

# E2E
cd frontend && npm run e2e
```

## Environment variables (backend)

All prefixed `GNAT_GUI_`. Key ones:

| Var | Default | Purpose |
|---|---|---|
| `DB_URL` | sqlite:///./dev.db | GUI database |
| `SECRET_KEY` | — | Session signing |
| `GNAT_CONFIG_PATH` | — | Path to GNAT config file |
| `LLM_API_KEY` | — | Anthropic API key for report drafting |
| `DEBUG` | false | Enables FastAPI debug mode |
