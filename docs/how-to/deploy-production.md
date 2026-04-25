# Deploy to production

This guide covers deploying GNAT-gui with Docker Compose in a production-like environment. It assumes you have Docker and Docker Compose v2 installed on the target host.

---

## 1. Copy the production Compose file

The repository ships with two Compose files:

| File | Purpose |
|---|---|
| `docker-compose.dev.yml` | Local development with hot reload, no TLS |
| `docker/docker-compose.yml` | Production: multi-stage builds, health checks, no dev tools |

From the repo root:

```bash
cp docker/docker-compose.yml ./docker-compose.yml
```

---

## 2. Create the environment file

```bash
cp .env.example .env
```

Set at minimum:

```dotenv
# Required — generate with: python -c "import secrets; print(secrets.token_hex(32))"
GNAT_GUI_SECRET_KEY=<64-hex-character-string>

# Database — use a strong password
GNAT_GUI_DB_URL=postgresql+psycopg2://gnat_gui:<password>@db/gnat_gui
POSTGRES_USER=gnat_gui
POSTGRES_PASSWORD=<same-strong-password>
POSTGRES_DB=gnat_gui

# Admin account — change before first boot
ADMIN_PASSWORD=<strong-admin-password>

# GNAT core configuration
GNAT_GUI_GNAT_CONFIG_PATH=/app/gnat-config.yml

# LLM (for report drafting and gap detection)
GNAT_GUI_LLM_API_KEY=<anthropic-api-key>
```

Do **not** commit `.env` to version control. See [Configuration reference](../reference/configuration.md) for all available variables.

---

## 3. Place your GNAT config

Mount your `gnat-config.yml` (from the GNAT core repo) to `/app/gnat-config.yml` inside the container, or set `GNAT_GUI_GNAT_CONFIG_PATH` to point to another location. The backend service in `docker-compose.yml` has a volume mount ready:

```yaml
volumes:
  - ./gnat-config.yml:/app/gnat-config.yml:ro
```

---

## 4. Build and start services

```bash
docker compose pull   # pull base images
docker compose build  # build backend + frontend images
docker compose up -d  # start in background
```

Services started:

| Service | Role |
|---|---|
| `db` | PostgreSQL 16 |
| `backend` | FastAPI application server (Uvicorn) |
| `frontend` | Nginx serving the compiled React SPA and proxying `/api` |

---

## 5. Run migrations and seed

On first boot, run migrations and seed inside the running backend container:

```bash
docker compose exec backend alembic upgrade head
docker compose exec backend python /app/scripts/seed.py
```

This only needs to run once. Subsequent deployments run `alembic upgrade head` automatically if you add it to the backend entrypoint, which is recommended.

---

## 6. Verify the deployment

```bash
# Check service health
docker compose ps

# Tail logs
docker compose logs -f backend

# Smoke test
curl -sf http://localhost/api/docs > /dev/null && echo "OK"
```

---

## 7. Configure TLS (recommended)

The production Nginx config in `docker/nginx.conf` is ready for TLS termination. The simplest approach is a reverse proxy in front (Nginx, Caddy, Traefik, or a cloud load balancer) that terminates TLS and passes plain HTTP to `localhost:80`.

Alternatively, mount your certificate into the Nginx container and uncomment the TLS server block in `docker/nginx.conf`.

---

## 8. Rotating the secret key

Changing `GNAT_GUI_SECRET_KEY` invalidates all existing CSRF tokens and session cookies. All users will be signed out. To rotate:

1. Update `GNAT_GUI_SECRET_KEY` in `.env`
2. `docker compose up -d --no-deps backend frontend`

---

## Updating to a new version

```bash
git pull
docker compose build
docker compose up -d
docker compose exec backend alembic upgrade head
```

Migrations are always safe to run on an already-migrated database (Alembic is idempotent).

---

## Troubleshooting

**Backend fails with `connection refused` to database**
The backend starts before PostgreSQL is ready. Compose `depends_on.condition: service_healthy` handles this in the production Compose file, but if your database is external ensure it is reachable at the configured URL.

**`GNAT_GUI_SECRET_KEY` not set**
The backend will start with the default `change-me-in-production` key and log a warning. CSRF protection is still active but the key is not secret. Always set a real key.

**Frontend shows blank page after upgrade**
Hard-refresh (`Ctrl+Shift+R`) to clear Vite asset hashes from the browser cache.
