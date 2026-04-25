---
layout: default
title: GNAT-gui
description: >-
  Analyst-facing graphical interface for GNAT — investigation management,
  Hy/YAML/Prolog rules, seed-driven evidence graphs, RBAC, audit trail,
  and real-time SSE streaming.
---

# GNAT-gui

Analyst-facing graphical interface for the [GNAT](https://github.com/wrhalpin/GNAT) threat intelligence platform. GNAT-gui pairs a **FastAPI backend** — importing GNAT as a Python library — with a **React SPA** to give analysts a full workbench for investigations, detection rules, and evidence graphs without leaving the browser.

<div class="stack-badges">
  <span class="badge badge-frontend">React 18 + TypeScript 5</span>
  <span class="badge badge-frontend">TanStack Router / Query / Table</span>
  <span class="badge badge-frontend">React Flow</span>
  <span class="badge badge-frontend">Monaco Editor</span>
  <span class="badge badge-backend">FastAPI 0.111+</span>
  <span class="badge badge-backend">SQLAlchemy 2.x</span>
  <span class="badge badge-backend">Pydantic v2</span>
  <span class="badge badge-backend">Alembic</span>
  <span class="badge badge-security">Argon2 passwords</span>
  <span class="badge badge-security">CSRF + rate limiting</span>
  <span class="badge badge-security">Append-only audit log</span>
</div>

---

## Modules

<div class="module-grid">

  <div class="module-card">
    <span class="module-icon">🔬</span>
    <h3>Analysis</h3>
    <p>Manage investigations with NATO Admiralty Scale hypothesis scoring, TLP markings, notes, timeline visualisation, and AI-assisted gap detection and report drafting via streaming jobs.</p>
    <ul>
      <li>Hypothesis scoring — A–F source reliability × 1–6 credibility</li>
      <li>TLP markings and STIX metadata display</li>
      <li>AI gap detection (streaming progress)</li>
      <li>LLM-powered structured report drafting</li>
    </ul>
  </div>

  <div class="module-card">
    <span class="module-icon">📐</span>
    <h3>Rules Builder</h3>
    <p>Author detection rules in three languages with Monaco, a 26-predicate palette, a visual YAML form builder, a streaming test runner, and a full promotion workflow with audit trail.</p>
    <ul>
      <li>Three engines: Hy · YAML DSL · Prolog</li>
      <li>26 STIX helper predicates with click-to-insert</li>
      <li>Fixture-based test runner with streaming results</li>
      <li>Draft → Active promotion (senior analyst+)</li>
    </ul>
  </div>

  <div class="module-card">
    <span class="module-icon">🗺️</span>
    <h3>Investigations</h3>
    <p>Seed-driven five-step evidence graph pipeline with a React Flow canvas for navigating 1,000+ node STIX 2.1 graphs, node expansion, edge filtering, and workspace materialisation.</p>
    <ul>
      <li>Pipeline: Seed → Expand → Normalise → Correlate → Materialise</li>
      <li>React Flow canvas with dagre layout</li>
      <li>Per-node expansion jobs with SSE progress</li>
      <li>Materialise to GNAT workspace (senior analyst+)</li>
    </ul>
  </div>

</div>

---

## How a request flows

<div class="workflow-diagram">
  <div class="stage">
    <span class="stage-label">Browser</span>
    React SPA
  </div>
  <div class="arrow">→</div>
  <div class="stage">
    <span class="stage-label">Middleware</span>
    CSRF · Rate limit · Session
  </div>
  <div class="arrow">→</div>
  <div class="stage">
    <span class="stage-label">Router</span>
    FastAPI endpoint
  </div>
  <div class="arrow">→</div>
  <div class="stage">
    <span class="stage-label">Facade</span>
    RBAC · Audit
  </div>
  <div class="arrow">→</div>
  <div class="stage">
    <span class="stage-label">GNAT core</span>
    analyst_services.*
  </div>
  <div class="arrow">⇄</div>
  <div class="stage">
    <span class="stage-label">SSE bridge</span>
    Job progress events
  </div>
</div>

Long-running operations (investigation build, rule test, gap detection, report drafting) return a `job_id` immediately. The frontend opens a Server-Sent Event stream at `/api/jobs/{id}/stream`; the SSE bridge polls `gnat.jobs.JobStore` every 250 ms and forwards `ProgressEvent`, `ResultEvent`, and `ErrorEvent` objects until the job reaches a terminal state.

---

## Access roles

<div class="role-grid">
  <div class="role-card role-viewer">
    <strong>viewer</strong>
    <p>Read-only access to all investigations, rules, and reports</p>
  </div>
  <div class="role-card role-analyst">
    <strong>analyst</strong>
    <p>Create and manage own investigations, rules, and report drafts</p>
  </div>
  <div class="role-card role-senior">
    <strong>senior_analyst</strong>
    <p>+ Materialise investigations · promote rules · publish reports · edit any</p>
  </div>
  <div class="role-card role-admin">
    <strong>admin</strong>
    <p>All permissions plus user management and audit log access</p>
  </div>
</div>

Permissions are enforced in the **facade layer** on every state-changing request. The frontend uses `usePermission()` to gate UI elements, but server-side enforcement is always authoritative. Every permission denial and every state change is recorded in the append-only audit log.

---

## Quick start

```bash
# Backend
cd backend
pip install -e ".[dev]" && pip install -e ../GNAT
cp .env.example .env          # set GNAT_GUI_SECRET_KEY + GNAT_GUI_DB_URL
alembic upgrade head
python ../scripts/seed.py
uvicorn gnat_gui.main:app --reload

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

Open `http://localhost:5173` and log in with `admin` / `changeme-please-set-env`.

**Or with Docker:**

```bash
docker compose -f docker-compose.dev.yml up
```

---

## Documentation

<div class="docs-quad">

  <div class="quad-card">
    <h4>📖 Tutorials</h4>
    <p>Step-by-step, guaranteed-success walkthroughs for newcomers</p>
    <ul>
      <li><a href="tutorials/getting-started.md">Getting started</a></li>
      <li><a href="tutorials/first-investigation.md">Your first investigation</a></li>
      <li><a href="tutorials/first-rule.md">Your first detection rule</a></li>
    </ul>
  </div>

  <div class="quad-card">
    <h4>🔧 How-to guides</h4>
    <p>Task-oriented recipes — assumes a running system</p>
    <ul>
      <li><a href="how-to/deploy-production.md">Deploy to production</a></li>
      <li><a href="how-to/write-a-rule.md">Write a detection rule</a></li>
      <li><a href="how-to/run-gap-detection.md">Run AI gap detection</a></li>
      <li><a href="how-to/manage-users.md">Manage users</a></li>
      <li><a href="how-to/add-an-api-endpoint.md">Add an API endpoint</a></li>
    </ul>
  </div>

  <div class="quad-card">
    <h4>📚 Reference</h4>
    <p>Dry, complete, authoritative technical specifications</p>
    <ul>
      <li><a href="reference/api-endpoints.md">API endpoints</a></li>
      <li><a href="reference/configuration.md">Configuration</a></li>
      <li><a href="reference/permissions.md">Permissions matrix</a></li>
      <li><a href="reference/rule-predicates.md">Rule predicates</a></li>
      <li><a href="reference/sse-events.md">SSE job events</a></li>
    </ul>
  </div>

  <div class="quad-card">
    <h4>💡 Explanation</h4>
    <p>Background reading — the why behind the design</p>
    <ul>
      <li><a href="explanation/architecture.md">Architecture overview</a></li>
      <li><a href="explanation/rbac-model.md">RBAC model</a></li>
      <li><a href="explanation/streaming-and-jobs.md">Streaming and jobs</a></li>
      <li><a href="explanation/two-database-model.md">Two-database model</a></li>
    </ul>
  </div>

</div>

---

## GNAT-o-sphere

GNAT-gui is one component of the GNAT threat intelligence ecosystem:

<div class="gnatophere-grid">

  <div class="card card-gnat">
    <h4>GNAT</h4>
    <p>Core headless library — STIX 2.1, three rule engines, analyst services, async job runner, and streaming callbacks</p>
    <a class="btn" href="https://github.com/wrhalpin/GNAT">GitHub →</a>
  </div>

  <div class="card card-gnatgui">
    <h4>GNAT-gui ✦</h4>
    <p>This project — FastAPI backend + React SPA analyst workbench with full RBAC, audit, and SSE streaming</p>
    <a class="btn" href="https://github.com/wrhalpin/GNAT-gui">GitHub →</a>
  </div>

  <div class="card card-sandgnat">
    <h4>SandGNAT</h4>
    <p>Automated malware sandbox — Proxmox detonation, trigram-similarity clustering, STIX 2.1 output</p>
    <a class="btn" href="https://wrhalpin.github.io/SandGNAT/">Docs →</a>
  </div>

  <div class="card card-redgnat">
    <h4>RedGNAT</h4>
    <p>Continuous automated red teaming — ingest threat intel, emulate adversaries, identify detection gaps</p>
    <a class="btn" href="https://wrhalpin.github.io/RedGNAT/">Docs →</a>
  </div>

  <div class="card card-sensegnat">
    <h4>SenseGNAT</h4>
    <p>Network profiling and behavioural pattern analysis for the GNAT intelligence pipeline</p>
    <a class="btn" href="https://wrhalpin.github.io/SenseGNAT/">Docs →</a>
  </div>

</div>

---

Licensed under [Apache 2.0](https://github.com/wrhalpin/GNAT-gui/blob/main/LICENSE) · [View on GitHub](https://github.com/wrhalpin/GNAT-gui) · [GNAT-o-sphere](https://wrhalpin.github.io/gnat-o-sphere/)
