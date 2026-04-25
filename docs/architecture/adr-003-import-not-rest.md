# ADR-003: Import GNAT as a library, not via REST

**Status:** Accepted

## Context

GNAT exposes a REST gateway at `gnat/dissemination/api/`. GNAT-gui could call that API over HTTP, or import `gnat` as a Python library in-process.

## Decision

Import `gnat` as a Python library. GNAT-gui's backend calls `gnat.analyst_services.*` directly.

## Rationale

- No network hop, no auth token management between services, no serialization round-trip
- Type safety end-to-end: Pydantic models from `gnat.schemas` are returned directly and serialized by FastAPI
- The REST gateway (`gnat/dissemination/api/`) is a public-facing API for external consumers; GNAT-gui is an internal trusted consumer
- Simpler deployment: one fewer service to run, configure, and monitor
- Streaming: `gnat.investigations.builder.build_with_progress()` uses callbacks; wrapping this in HTTP calls would require a separate streaming protocol anyway

## Consequences

- GNAT-gui backend and GNAT core must be deployed together (same Python environment)
- GNAT version upgrades require GNAT-gui to be tested and potentially updated; addressed by contract tests and pinned releases
- Cannot deploy GNAT-gui backend without a working GNAT installation
