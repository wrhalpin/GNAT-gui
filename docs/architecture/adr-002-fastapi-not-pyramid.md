# ADR-002: FastAPI as the backend framework

**Status:** Accepted

## Context

GNAT core already uses FastAPI for `gnat/serve/` and `gnat/dissemination/api/`. We need a web framework for GNAT-gui's backend.

## Decision

FastAPI 0.111+.

## Rationale

- Pydantic v2 integration is first-class; all request/response validation is handled automatically
- OpenAPI schema is generated automatically — feeds the type generation pipeline for the frontend
- Async support matches the SSE streaming requirements for job progress
- Team already knows it from GNAT core; no context switch
- Alternatives considered: Django REST Framework (too heavyweight, ORM coupling), Litestar (less ecosystem maturity), Flask (no async, manual OpenAPI)

## Consequences

- Commits to Pydantic v2 and Python 3.11+ (both already required by GNAT core)
- FastAPI's dependency injection system is used pervasively; contributors must understand it
- Uvicorn is the ASGI server in both dev and production
