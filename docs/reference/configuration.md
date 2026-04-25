# Configuration reference

All configuration is provided via environment variables with the prefix `GNAT_GUI_`. Variables can also be set in a `.env` file in the `backend/` directory (loaded automatically by pydantic-settings).

---

## Core

| Variable | Type | Default | Description |
|---|---|---|---|
| `GNAT_GUI_SECRET_KEY` | `str` | `change-me-in-production` | Secret used to sign CSRF tokens and session tokens. **Must be changed in production.** Generate with `python -c "import secrets; print(secrets.token_hex(32))"`. |
| `GNAT_GUI_DEBUG` | `bool` | `false` | Enables FastAPI debug mode. Never set `true` in production. |

## Database

| Variable | Type | Default | Description |
|---|---|---|---|
| `GNAT_GUI_DB_URL` | `str` | `postgresql+psycopg2://gnat_gui:gnat_gui@localhost/gnat_gui` | SQLAlchemy database URL for the GUI database. Supports PostgreSQL and (for testing) SQLite. |

## Session

| Variable | Type | Default | Description |
|---|---|---|---|
| `GNAT_GUI_SESSION_EXPIRE_SECONDS` | `int` | `86400` | Session lifetime in seconds. Default is 24 hours. |

## Rate limiting

| Variable | Type | Default | Description |
|---|---|---|---|
| `GNAT_GUI_LOGIN_RATE_LIMIT` | `str` | `10/minute` | slowapi limit string applied to `POST /api/auth/login`. Format: `<count>/<period>` where period is `second`, `minute`, `hour`, or `day`. |

## GNAT core

| Variable | Type | Default | Description |
|---|---|---|---|
| `GNAT_GUI_GNAT_CONFIG_PATH` | `str \| None` | `None` | Absolute path to the GNAT core configuration file (`gnat-config.yml`). If unset, GNAT uses its own default config resolution. |

## LLM (report drafting)

| Variable | Type | Default | Description |
|---|---|---|---|
| `GNAT_GUI_LLM_API_KEY` | `str \| None` | `None` | Anthropic API key. Required for report drafting and AI-assisted gap analysis. |
| `GNAT_GUI_LLM_MODEL` | `str` | `claude-sonnet-4-6` | Claude model ID to use for report drafting. |

## CORS

| Variable | Type | Default | Description |
|---|---|---|---|
| `GNAT_GUI_CORS_ORIGINS` | `list[str]` | `["http://localhost:5173"]` | Allowed CORS origins. In production set to your frontend hostname(s), e.g. `["https://gnat.example.com"]`. |

## OIDC / SSO (optional)

| Variable | Type | Default | Description |
|---|---|---|---|
| `GNAT_GUI_OIDC_ISSUER` | `str \| None` | `None` | OIDC provider issuer URL, e.g. `https://auth.example.com`. If set, enables OIDC login. |
| `GNAT_GUI_OIDC_CLIENT_ID` | `str \| None` | `None` | OIDC client ID. |
| `GNAT_GUI_OIDC_CLIENT_SECRET` | `str \| None` | `None` | OIDC client secret. |

---

## Example `.env` file

```dotenv
# Required for production
GNAT_GUI_SECRET_KEY=c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2

# Database
GNAT_GUI_DB_URL=postgresql+psycopg2://gnat_gui:strongpassword@db/gnat_gui

# GNAT core
GNAT_GUI_GNAT_CONFIG_PATH=/app/gnat-config.yml

# LLM
GNAT_GUI_LLM_API_KEY=sk-ant-api03-...
GNAT_GUI_LLM_MODEL=claude-sonnet-4-6

# CORS (production hostname)
GNAT_GUI_CORS_ORIGINS=["https://gnat.example.com"]
```

---

## Notes

- Boolean environment variables accept `true`/`false` (case-insensitive), `1`/`0`, `yes`/`no`.
- List environment variables accept a JSON array string: `["item1","item2"]`.
- The `.env` file is loaded from the directory where the process starts, typically `backend/`. In Docker deployments, pass variables via the Compose `environment:` key or an `env_file:` reference instead.
