# Contributing to GNAT-gui

## Development setup

```bash
# GNAT core (editable install)
pip install -e ../GNAT

# Backend
cd backend && pip install -e ".[dev]"
alembic upgrade head
python ../scripts/seed.py

# Frontend
cd frontend && npm install
npm run dev
```

## Branch model

- `main` — always releasable
- Feature branches: `feature/<slug>`
- Bug fixes: `fix/<slug>`
- Open a PR against `main`; squash merge on approval

## Code standards

**Backend**
- Ruff lint + format (`ruff check . && ruff format .`)
- mypy strict (`mypy gnat_gui`)
- Bandit security scan (`bandit -r gnat_gui`)
- pytest with ≥75% coverage gate

**Frontend**
- ESLint + TypeScript strict (`npm run lint && npm run type-check`)
- Vitest for unit tests (`npm test`)
- Playwright for e2e (`npm run e2e`)

Run everything before opening a PR:
```bash
# Backend
cd backend && ruff check . && ruff format --check . && mypy gnat_gui && pytest

# Frontend
cd frontend && npm run lint && npm run type-check && npm test && npm run build
```

## Adding a new domain endpoint

1. Add route to the appropriate router in `gnat_gui/routers/`
2. Add facade method in `gnat_gui/services/*_facade.py` — always: check RBAC → call core service → record audit → return schema
3. Update `gnat_gui/schemas/` if new request/response shapes are needed
4. Run `scripts/generate-types.mjs` to regenerate `frontend/src/api/generated.ts`
5. Add TanStack Query hook in `frontend/src/api/queries/`
6. Write unit test for facade, router test with mocked facade, integration test

## Dependency on GNAT core

During development use an editable install: `pip install -e ../GNAT`

CI and production pin a release tag. If your change requires a new GNAT core API, coordinate with the core team and track in the companion `gnat_core_changes_plan.md`.

## Security

See [SECURITY.md](./SECURITY.md) for vulnerability reporting.
