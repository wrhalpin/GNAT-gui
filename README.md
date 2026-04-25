# GNAT-gui

Graphical interface for [GNAT](https://github.com/wrhalpin/GNAT) analyst workflows.

---

## Modules

| Module | Purpose |
|---|---|
| **Analysis** | Investigations, hypotheses with NATO Admiralty Scale scoring, notes, timeline, AI gap detection, report drafting |
| **Rules Builder** | Hy / YAML / Prolog rule authoring with Monaco editor, 26-predicate palette, test runner, promotion workflow |
| **Investigations** | Seed-driven evidence graph builder (5-step pipeline), React Flow canvas, node expansion, STIX materialisation |

---

## Documentation

Full documentation lives in [`docs/`](docs/index.md) and is organised using the [Diataxis](https://diataxis.fr) framework.

| Need | Where to look |
|---|---|
| Install and run for the first time | [Getting started tutorial](docs/tutorials/getting-started.md) |
| Deploy to production | [Deploy to production](docs/how-to/deploy-production.md) |
| Write a detection rule | [Write a detection rule](docs/how-to/write-a-rule.md) |
| All API endpoints | [API endpoints reference](docs/reference/api-endpoints.md) |
| All environment variables | [Configuration reference](docs/reference/configuration.md) |
| Understand the architecture | [Architecture overview](docs/explanation/architecture.md) |

---

## Quick start (development)

**Requirements:** Python 3.11+, Node 20+, PostgreSQL 14+

```bash
# Backend
cd backend
pip install -e ".[dev]"
pip install -e ../GNAT          # GNAT core (sibling checkout)
cp .env.example .env            # edit SECRET_KEY and DB_URL
alembic upgrade head
python ../scripts/seed.py
uvicorn gnat_gui.main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev                     # starts Vite at http://localhost:5173
```

Log in at `http://localhost:5173` with `admin` / `changeme-please-set-env`.

Or use Docker:

```bash
docker compose -f docker-compose.dev.yml up
```

---

## Architecture

- **Frontend:** React 18 + TypeScript 5, Vite, TanStack Router/Query/Table, React Flow, Monaco, Tailwind + shadcn/ui, Zustand
- **Backend:** FastAPI 0.111+, SQLAlchemy 2.x, Pydantic v2, Alembic, argon2-cffi
- **GNAT core:** imported as a Python library — no network hop, full type safety

See [Architecture overview](docs/explanation/architecture.md) for the full system diagram and request lifecycle.

---

## Testing

```bash
cd backend  && pytest --cov=gnat_gui    # backend (Python)
cd frontend && npm test                  # unit tests (Vitest)
cd frontend && npm run e2e               # end-to-end (Playwright)
```

---

## License

Apache 2.0 — see [LICENSE](LICENSE).
