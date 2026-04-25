# Run the test suite

---

## Backend tests

The backend test suite uses **pytest** with **pytest-asyncio** and runs against an in-memory SQLite database.

### Run all tests

```bash
cd backend
pytest
```

### Run with coverage

```bash
pytest --cov=gnat_gui --cov-report=term-missing
```

The coverage gate is 75 %. CI fails below this threshold.

### Run a specific test file or test

```bash
pytest tests/integration/test_auth_flow.py
pytest tests/unit/rbac/test_service.py::test_analyst_can_create_investigation
```

### Linting and type checking

```bash
ruff check .          # lint
ruff format --check . # format check
mypy gnat_gui         # type check (strict mode)
bandit -r gnat_gui    # security scan
```

All four checks run in CI on every push.

---

## Frontend unit tests

Frontend unit tests use **Vitest** and **React Testing Library**.

### Run all unit tests

```bash
cd frontend
npm test
```

### Run in watch mode

```bash
npm run test:watch
```

### Run with coverage

```bash
npm run test:coverage
```

### Run a specific test file

```bash
npx vitest run tests/unit/confidence-badge.test.tsx
```

---

## End-to-end tests

E2E tests use **Playwright** against a live running stack.

### Prerequisites

The e2e suite needs both the backend and frontend running. The Playwright config starts a Vite dev server automatically when `npm run e2e` is called, but the backend must already be running:

**Terminal 1:**
```bash
cd backend && uvicorn gnat_gui.main:app --reload --port 8000
```

**Terminal 2:**
```bash
cd frontend && npm run e2e
```

### Run in headed mode (see the browser)

```bash
cd frontend && npx playwright test --headed
```

### Run a specific spec

```bash
npx playwright test tests/e2e/smoke.spec.ts
```

### View the test report

After a run:

```bash
npx playwright show-report
```

---

## Running everything locally before a PR

```bash
# From repo root
cd backend && ruff check . && ruff format --check . && mypy gnat_gui && pytest --cov=gnat_gui
cd ../frontend && npm run type-check && npm test && npm run build
```

The `scripts/dev.sh` script starts both servers together; open a second terminal for the e2e run.

---

## CI pipeline

Tests run automatically on every push and pull request:

| Workflow | Trigger | What it runs |
|---|---|---|
| `backend-test.yml` | push / PR | ruff, mypy, pytest with Postgres |
| `frontend-test.yml` | push / PR | ESLint, TypeScript, Vitest, Vite build |
| `e2e.yml` | PR + nightly | Full Playwright suite via Docker Compose |
| `backend-codeql.yml` | push / PR / weekly | CodeQL static analysis |
