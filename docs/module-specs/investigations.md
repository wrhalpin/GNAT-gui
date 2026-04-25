# Investigations Module Spec

## Purpose

Seed-driven evidence graph builder. Analyst provides one or more seed objects (indicators, threat actors, campaigns, custom STIX), the five-step pipeline builds a STIX 2.1 correlation graph, and the analyst can explore, expand, filter, and materialize it into a GNAT workspace.

## Five-step pipeline

| Step | Description | Builder checkpoint |
|------|-------------|-------------------|
| Seed | Translate seeds into platform queries | 0.0 |
| Expand | Fetch constituent evidence from 159 connectors | 0.1 |
| Normalise | Convert records to EvidenceNode (STIX SDOs) | 0.5 |
| Correlate | Build cross-system edges with confidence scores | 0.8 |
| Materialise | Persist to GNAT workspace (senior_analyst only) | 1.0 |

Progress streams to the frontend via SSE (`ProgressEvent` at each checkpoint, `ResultEvent` on completion).

## Backend routes

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/investigations` | `investigation.create` | Submit build job → `{ job_id }` |
| GET | `/api/investigations/{id}/graph` | `investigation.read.own` | Fetch built graph |
| POST | `/api/investigations/{id}/expand` | `investigation.update.own` | Expand a node → `{ job_id }` |
| POST | `/api/investigations/{id}/materialize` | `investigation.materialize` | Materialize to workspace |
| GET | `/api/jobs/{job_id}/stream` | (any authenticated) | SSE stream |
| GET | `/api/jobs/{job_id}` | (any authenticated) | Poll fallback |

## Graph data model

Nodes map to STIX SDO types: `indicator`, `threat-actor`, `campaign`, `malware`, `attack-pattern`, `vulnerability`, `observed-data`, `identity`.

Edges map to STIX SRO types: `uses`, `indicates`, `attributed-to`, `targets`, `related-to`, `mitigates`. Edge thickness and color encode correlation confidence (0.0–1.0).

## Frontend pages

- `/investigations` — index, link to new
- `/investigations/new` — seed picker form
- `/investigations/:id` — React Flow canvas with edge filter, node detail drawer, materialize action

## Performance target

1000+ nodes at 60fps. Achieved via React Flow's built-in virtualisation and memoized custom node components.
