# Getting started

This tutorial walks you from a fresh checkout to a running GNAT-gui development environment with an admin account ready to use. It takes about 20 minutes.

**What you will have at the end:** a backend API server and frontend dev server running locally, seeded with default roles and an admin user, accessible at `http://localhost:5173`.

---

## Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.11 or later |
| Node.js | 20 or later |
| PostgreSQL | 14 or later (or Docker) |
| GNAT core | cloned alongside this repo at `../GNAT` |

> **No PostgreSQL installed?** The quickest path is Docker:
> ```bash
> docker run -d --name gnat-postgres \
>   -e POSTGRES_USER=gnat_gui \
>   -e POSTGRES_PASSWORD=gnat_gui \
>   -e POSTGRES_DB=gnat_gui \
>   -p 5432:5432 postgres:16
> ```

---

## Step 1 — Clone the repository

```bash
git clone https://github.com/wrhalpin/GNAT-gui.git
cd GNAT-gui
```

---

## Step 2 — Install backend dependencies

```bash
cd backend
pip install -e ".[dev]"
```

This installs the `gnat_gui` package in editable mode along with FastAPI, SQLAlchemy, testing tools, and linters. GNAT core is listed as a dependency; pip will attempt to resolve it from your environment. If you have GNAT cloned alongside this repo, install it first:

```bash
pip install -e ../GNAT
```

---

## Step 3 — Configure the environment

Copy the example environment file and edit it:

```bash
cp .env.example .env   # if no example exists, create .env manually
```

Minimum required values:

```dotenv
GNAT_GUI_SECRET_KEY=replace-with-a-long-random-string
GNAT_GUI_DB_URL=postgresql+psycopg2://gnat_gui:gnat_gui@localhost/gnat_gui
```

Generate a secret key with:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

For a full list of available configuration options, see the [Configuration reference](../reference/configuration.md).

---

## Step 4 — Run database migrations

```bash
# still inside backend/
alembic upgrade head
```

This creates all GUI database tables: users, sessions, roles, audit events, UI state, and investigation ownership records.

---

## Step 5 — Seed roles and admin user

```bash
python ../scripts/seed.py
```

This creates the four built-in roles (`viewer`, `analyst`, `senior_analyst`, `admin`) and a default `admin` user. The admin password defaults to `changeme-please-set-env`; override it before going anywhere near production:

```bash
ADMIN_PASSWORD=a-very-strong-password python ../scripts/seed.py
```

---

## Step 6 — Start the backend

```bash
uvicorn gnat_gui.main:app --reload --port 8000
```

You should see:

```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

Verify it is running: open `http://localhost:8000/api/docs` in a browser. You should see the FastAPI Swagger UI.

---

## Step 7 — Install frontend dependencies and start the dev server

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The `dev` script first runs `generate-types` to pull the OpenAPI schema from the running backend and write `src/api/generated.ts`, then starts Vite. You should see:

```
  VITE v5.x.x  ready in 800 ms
  ➜  Local:   http://localhost:5173/
```

---

## Step 8 — Log in

Open `http://localhost:5173` in your browser. You will be redirected to the login page.

Enter:
- **Username:** `admin`
- **Password:** `changeme-please-set-env` (or whatever you set in step 5)

Click **Sign in**. You will be redirected to the dashboard.

---

## What's next?

- Follow the [Your first investigation](first-investigation.md) tutorial to build an evidence graph.
- Follow the [Your first rule](first-rule.md) tutorial to write a detection rule.
- Read the [Architecture overview](../explanation/architecture.md) to understand how the system fits together.
