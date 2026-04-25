# API endpoints reference

The GNAT-gui backend exposes a REST API under the `/api` prefix. All endpoints return JSON. Interactive documentation (Swagger UI) is available at `/api/docs`.

Authentication is via a session cookie (`session`) set on successful login. All state-changing endpoints also require the `X-CSRF-Token` header (the token is returned by `GET /api/auth/me` and stored client-side).

---

## Auth — `/api/auth`

### `POST /api/auth/login`

Authenticate and create a session.

Rate-limited to **10 requests per minute** per IP address.

**Request body**
```json
{ "username": "string", "password": "string" }
```

**Response 200**
```json
{
  "user_id": "string",
  "username": "string",
  "role": "analyst",
  "expires_at": "2026-04-26T00:00:00Z"
}
```

Sets a `session` cookie (`httpOnly`, `Secure`, `SameSite=Lax`).

**Response 401** — invalid credentials

---

### `POST /api/auth/logout`

Invalidate the current session.

**Response 200** — `{ "ok": true }` and clears the session cookie

---

### `GET /api/auth/me`

Return the currently authenticated user.

**Response 200**
```json
{
  "user_id": "string",
  "username": "string",
  "role": "analyst",
  "permissions": ["investigation.create", "rule.read", "..."]
}
```

**Response 401** — not authenticated

---

## Analysis — `/api/analysis`

All endpoints require `investigation.read.own` at minimum.

### `GET /api/analysis/investigations`

List investigations visible to the current user.

**Query params:** `page` (int, default 1), `page_size` (int, default 25), `status` (filter by status)

**Response 200** — paginated list of investigation summaries

---

### `POST /api/analysis/investigations`

Create a new investigation. Requires `investigation.create`.

**Request body**
```json
{ "title": "string", "description": "string" }
```

**Response 201** — investigation object

---

### `GET /api/analysis/investigations/{id}`

Get a single investigation with hypotheses and notes.

**Response 200** — full investigation detail

**Response 403** — user cannot read this investigation

---

### `PATCH /api/analysis/investigations/{id}`

Update investigation title, description, or status. Requires `investigation.update.own` (or `.any` for others' investigations).

**Request body** — partial update: `title?`, `description?`, `status?`

---

### `DELETE /api/analysis/investigations/{id}`

Delete an investigation. Requires `investigation.delete.own` (or `.any`).

**Response 204**

---

### `POST /api/analysis/investigations/{id}/hypotheses`

Add a hypothesis. Requires `investigation.update.own`.

**Request body**
```json
{
  "title": "string",
  "description": "string",
  "source_reliability": "B",
  "information_credibility": 3,
  "tags": ["attribution"]
}
```

---

### `PATCH /api/analysis/investigations/{id}/hypotheses/{hyp_id}`

Update a hypothesis.

---

### `POST /api/analysis/investigations/{id}/notes`

Add a note.

**Request body** — `{ "content": "string" }`

---

### `POST /api/analysis/investigations/{id}/gap-detection`

Submit a gap detection job. Requires `investigation.read.own`.

**Response 202** — `{ "job_id": "string" }`

---

### `POST /api/analysis/investigations/{id}/report-draft`

Submit a report drafting job. Requires `report.create`.

**Request body**
```json
{ "report_type": "tactical", "tlp": "amber" }
```

**Response 202** — `{ "job_id": "string" }`

---

### `POST /api/analysis/reports/{id}/publish`

Publish a report. Requires `report.publish`.

**Response 200**

---

## Rules — `/api/rules`

### `GET /api/rules`

List rules. Requires `rule.read`.

**Query params:** `status` (`draft` | `active`), `engine` (`hy` | `yaml` | `prolog`), `page`, `page_size`

---

### `POST /api/rules`

Create a rule. Requires `rule.create`.

**Request body**
```json
{
  "name": "string",
  "description": "string",
  "engine": "yaml",
  "body": "string",
  "severity": "high",
  "tags": ["phishing"]
}
```

---

### `GET /api/rules/{id}`

Get a single rule with full body and audit trail.

---

### `PATCH /api/rules/{id}`

Update a rule. Requires `rule.update.own` (or `.any`).

---

### `DELETE /api/rules/{id}`

Delete a rule. Requires `rule.update.own` (or `.any`).

---

### `POST /api/rules/{id}/test`

Submit a test job. Requires `rule.test`.

**Request body**
```json
{ "fixture": { "type": "bundle", "objects": [...] } }
```

**Response 202** — `{ "job_id": "string" }`

---

### `GET /api/rules/{id}/audit`

Return the audit trail for a rule. Requires `rule.read`.

---

### `POST /api/rules/{id}/promote`

Promote rule from `draft` to `active`. Requires `rule.publish`.

---

## Investigations — `/api/investigations`

### `POST /api/investigations/build`

Submit an investigation build job. Requires `investigation.create`.

**Request body**
```json
{ "seeds": [{ "type": "domain", "value": "evil.example.com" }] }
```

**Response 202** — `{ "job_id": "string", "investigation_id": "string" }`

---

### `GET /api/investigations/{id}/graph`

Return the full graph (nodes and edges). Requires `investigation.read.own`.

**Response 200**
```json
{
  "nodes": [{ "id": "...", "type": "indicator", "data": {...} }],
  "edges": [{ "id": "...", "source": "...", "target": "...", "relation": "...", "confidence": 0.8 }]
}
```

---

### `POST /api/investigations/{id}/nodes/{node_id}/expand`

Expand a single node. Requires `investigation.update.own`.

**Response 202** — `{ "job_id": "string" }`

---

### `POST /api/investigations/{id}/materialize`

Materialise the graph to the GNAT workspace. Requires `investigation.materialize`.

**Response 202** — `{ "job_id": "string" }`

---

## Jobs — `/api/jobs`

### `GET /api/jobs/{id}/stream`

Open an SSE stream for job progress. No CSRF token required (GET, read-only).

See [SSE job events reference](sse-events.md) for the event format.

---

### `GET /api/jobs/{id}`

Poll the current job status without SSE.

**Response 200** — `{ "job_id", "status", "progress", "message", "result", "error" }`

---

## Preferences — `/api/prefs`

### `GET /api/prefs/{key}`

Get a UI preference value. Any authenticated user.

---

### `PUT /api/prefs/{key}`

Set a UI preference value. Any authenticated user.

**Request body** — `{ "value": <any JSON object> }`

---

## Admin — `/api/admin`

All admin endpoints require `admin.users` permission (admin role only).

### `GET /api/admin/users`

List all users.

---

### `POST /api/admin/users`

Create a user.

**Request body** — `{ "username", "password", "role" }`

---

### `GET /api/admin/users/{id}`

Get a single user.

---

### `PATCH /api/admin/users/{id}`

Update role or active status. **Request body** — `{ "role"?, "is_active"? }`

---

### `GET /api/admin/audit`

Query the audit log. Requires `audit.read`.

**Query params:** `page`, `page_size`, `action`, `user_id`, `after`, `before`
