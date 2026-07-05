import re

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette_csrf import CSRFMiddleware

from gnat_gui.config import settings
from gnat_gui.rate_limit import limiter
from gnat_gui.routers import admin, analysis, auth, investigations, jobs, prefs, rules

import gnat_gui.jobs as _job_handlers  # noqa: F401  registers @job handlers

# starlette-csrf matches request paths against compiled regex Patterns (not strings).
# Login is exempt (no session cookie yet, pre-auth) and job SSE streams are GET-only.
CSRF_EXEMPT_URLS = [
    re.compile(r"^/api/auth/login$"),
    re.compile(r"^/api/jobs/"),
]


def create_app() -> FastAPI:
    app = FastAPI(
        title="GNAT-gui API",
        version="0.1.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/openapi.json",
    )

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # CSRF protection for all state-changing routes. Uses the double-submit-cookie
    # pattern: the middleware sets a JS-readable `csrftoken` cookie, and the SPA echoes
    # it back in the `x-csrftoken` header on unsafe requests (see frontend api/client.ts).
    app.add_middleware(
        CSRFMiddleware,
        secret=settings.secret_key,
        exempt_urls=CSRF_EXEMPT_URLS,
        cookie_secure=settings.cookie_secure,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router)
    app.include_router(admin.router)
    app.include_router(prefs.router)
    app.include_router(analysis.router)
    app.include_router(rules.router)
    app.include_router(investigations.router)
    app.include_router(jobs.router)

    return app


app = create_app()
