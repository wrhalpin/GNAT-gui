# GNAT-gui Documentation

GNAT-gui is an analyst-facing web application that wraps the [GNAT](https://github.com/wrhalpin/GNAT) intelligence analysis library with a graphical interface for managing investigations, authoring detection rules, and building evidence graphs.

---

## Documentation map

Diataxis organises this documentation into four types. If you are unsure where to start, the table below points you to the right place.

| I want to… | Go to |
|---|---|
| Install and run the app for the first time | [Getting started tutorial](tutorials/getting-started.md) |
| Follow a guided walkthrough of a feature | [Tutorials](tutorials/) |
| Accomplish a specific task | [How-to guides](how-to/) |
| Look up an API endpoint, config var, or permission | [Reference](reference/) |
| Understand *why* the system works the way it does | [Explanation](explanation/) |

---

## Tutorials — learning by doing

Step-by-step walkthroughs for newcomers. Each tutorial ends with a working result.

- [Getting started](tutorials/getting-started.md) — install, configure, and run GNAT-gui for the first time
- [Your first investigation](tutorials/first-investigation.md) — build an evidence graph and add a hypothesis
- [Your first rule](tutorials/first-rule.md) — write, test, and audit a detection rule

---

## How-to guides — solving specific problems

Task-oriented recipes. They assume you already have a running system.

**Operations**
- [Deploy to production](how-to/deploy-production.md) — Docker, environment, first-run setup
- [Manage users](how-to/manage-users.md) — create accounts, assign roles, deactivate users
- [Run the test suite](how-to/run-tests.md) — backend, frontend, and end-to-end tests

**Analyst workflows**
- [Write a detection rule](how-to/write-a-rule.md) — Hy, YAML DSL, and Prolog examples
- [Run AI gap detection and report drafting](how-to/run-gap-detection.md) — streaming analysis on an investigation

**Development**
- [Add a new API endpoint](how-to/add-an-api-endpoint.md) — the facade pattern, step by step
- [Keep API types in sync](how-to/generate-api-types.md) — running the openapi-typescript pipeline

---

## Reference — technical specifications

Dry, complete, authoritative.

- [API endpoints](reference/api-endpoints.md) — every HTTP route with method, path, auth, and schema
- [Configuration](reference/configuration.md) — all `GNAT_GUI_*` environment variables
- [Permissions](reference/permissions.md) — role × permission matrix
- [Rule predicates](reference/rule-predicates.md) — all 26 STIX helper predicates with signatures
- [Audit events](reference/audit-events.md) — every `AuditAction` value
- [SSE job events](reference/sse-events.md) — streaming event shapes from the job bridge
- [NATO Admiralty Scale](reference/admiralty-scale.md) — confidence scoring system

---

## Explanation — understanding

Background reading that explains the *why* behind design decisions.

- [Architecture overview](explanation/architecture.md) — system diagram, layers, data flow
- [RBAC model](explanation/rbac-model.md) — roles, permissions, enforcement, audit integration
- [Streaming and jobs](explanation/streaming-and-jobs.md) — how async progress events reach the browser
- [Two-database model](explanation/two-database-model.md) — why GUI state and GNAT domain data live in separate databases

---

## Architecture decisions

Individual ADR records live in [docs/architecture/](architecture/).

| ADR | Decision |
|---|---|
| [001](architecture/adr-001-monorepo.md) | Single monorepo for backend and frontend |
| [002](architecture/adr-002-fastapi-not-pyramid.md) | FastAPI over Pyramid/Flask |
| [003](architecture/adr-003-import-not-rest.md) | Import GNAT as a Python library, not over HTTP |
| [004](architecture/adr-004-react-stack.md) | React + TanStack + shadcn/ui frontend stack |
| [005](architecture/adr-005-separate-gui-db.md) | Separate PostgreSQL database for GUI concerns |
