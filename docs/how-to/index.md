---
layout: default
title: How-to guides — GNAT-gui
---

# How-to guides

Task-oriented recipes that assume you already have GNAT-gui running. Each guide focuses on one concrete goal and gets you there with the minimum number of steps.

---

## Operations

| Guide | What it covers |
|---|---|
| [Deploy to production](deploy-production.md) | Docker Compose, environment file, TLS, first-run migrations |
| [Manage users](manage-users.md) | Create accounts, assign roles, deactivate users via the admin UI or API |
| [Run the test suite](run-tests.md) | Backend pytest, frontend Vitest, Playwright end-to-end |

## Analyst workflows

| Guide | What it covers |
|---|---|
| [Write a detection rule](write-a-rule.md) | Hy, YAML DSL, and Prolog examples with the predicate palette |
| [Run AI gap detection and report drafting](run-gap-detection.md) | Submit jobs, watch SSE progress, edit and publish drafts |

## Development

| Guide | What it covers |
|---|---|
| [Add a new API endpoint](add-an-api-endpoint.md) | The facade pattern step-by-step — schema → facade → router → test |
| [Keep API types in sync](generate-api-types.md) | The openapi-typescript pipeline, when to run it, troubleshooting |

---

[← Documentation index](../index.md)
