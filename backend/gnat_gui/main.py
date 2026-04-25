from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from gnat_gui.config import settings
from gnat_gui.routers import admin, analysis, auth, investigations, jobs, prefs, rules

import gnat_gui.jobs as _job_handlers  # noqa: F401  registers @job handlers


def create_app() -> FastAPI:
    app = FastAPI(
        title="GNAT-gui API",
        version="0.1.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/openapi.json",
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
