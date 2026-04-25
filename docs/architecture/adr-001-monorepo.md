# ADR-001: Monorepo structure

**Status:** Accepted

## Context

GNAT-gui has a FastAPI backend and a React frontend that are developed together and released as a unit. We need to decide whether to keep them in a single repository or separate repositories.

## Decision

Single monorepo with `backend/` and `frontend/` at the root. Independent deploy artifacts (Docker images) are produced by CI from the same git SHA.

## Rationale

- Atomic commits spanning backend + frontend schema changes (e.g. adding a Pydantic field and the corresponding TypeScript usage in one PR)
- Single issue tracker, single PR process, single CI pipeline
- Type generation script (`scripts/generate-types.mjs`) runs against the backend's OpenAPI output — easier to keep in sync
- GNAT-gui is maintained by a small team; the coordination overhead of two repos outweighs the isolation benefits

## Consequences

- Backend and frontend share a git history; contributors need familiarity with both
- CI must gate backend and frontend independently so a frontend failure doesn't block a backend-only hotfix (handled by separate workflow files)
- Deploy artifacts remain independent — backend and frontend Docker images are tagged and pushed separately in the release workflow
