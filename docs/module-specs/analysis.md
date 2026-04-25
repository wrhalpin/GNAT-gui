# Analysis Module Spec

## Purpose

Provides analyst-facing workflows for managing investigations, scoring hypotheses with NATO Admiralty Scale confidence, writing notes, viewing evidence timelines, running AI-assisted gap detection, and drafting reports.

## Backend routes

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/analysis/investigations` | `investigation.read.own` | List investigations |
| POST | `/api/analysis/investigations` | `investigation.create` | Create investigation |
| GET | `/api/analysis/investigations/{id}` | `investigation.read.own` | Get investigation detail |
| PATCH | `/api/analysis/investigations/{id}` | `investigation.update.own` | Update investigation |
| DELETE | `/api/analysis/investigations/{id}` | `investigation.delete.own` | Delete investigation |
| POST | `/api/analysis/investigations/{id}/hypotheses` | `investigation.update.own` | Add hypothesis |
| PATCH | `/api/analysis/investigations/{id}/hypotheses/{hyp_id}` | `investigation.update.own` | Update hypothesis |
| POST | `/api/analysis/investigations/{id}/notes` | `investigation.update.own` | Add note |
| GET | `/api/analysis/investigations/{id}/timeline` | `investigation.read.own` | Get timeline events |
| POST | `/api/analysis/investigations/{id}/gap-detection` | `investigation.read.own` | Submit gap detection job |
| POST | `/api/analysis/investigations/{id}/draft-report` | `report.create` | Submit report draft job |

## Hypothesis scoring

Uses the NATO Admiralty Scale:

- **Source reliability** (A–F): A=Completely reliable → F=Cannot be judged
- **Information credibility** (1–6): 1=Confirmed → 6=Cannot be judged
- **Numeric confidence** (0.0–1.0): derived or manually overridden

## Frontend pages

- `/analysis` — filterable investigation list (TanStack Table)
- `/analysis/:id` — investigation detail with hypothesis cards, notes pane, timeline view, gap detector side panel, report drafting panel

## Streaming

Gap detection and report drafting return `{ job_id }`. Frontend opens SSE at `/api/jobs/{job_id}/stream` and receives `ProgressEvent` objects during execution, followed by a `ResultEvent` on completion.
