---
layout: default
title: Explanation — GNAT-gui
---

# Explanation

Background reading that explains the *why* behind GNAT-gui's design. You don't need to read these to use the product, but they're worth reading before making changes to the system or evaluating architectural trade-offs.

---

## [Architecture overview](architecture.md)

The full system diagram — two databases, four layers (router / facade / GNAT core / SSE bridge), frontend data flow, and production deployment topology. Start here if you're new to the codebase.

## [RBAC model](rbac-model.md)

How roles, permissions, and enforcement fit together. Explains why enforcement lives in the facade layer, how permission changes take effect, and how audit events are coupled to RBAC checks.

## [Streaming and jobs](streaming-and-jobs.md)

Why GNAT-gui uses a submit-and-stream pattern instead of blocking HTTP requests, how the async SSE bridge polls the synchronous `gnat.jobs.JobStore`, and what happens when a browser disconnects mid-stream.

## [Two-database model](two-database-model.md)

Why the GUI has its own PostgreSQL database (users, sessions, RBAC, audit) that never shares a migration with the GNAT core database, and how investigation ownership spans the boundary.

---

[← Documentation index](../index.md)
