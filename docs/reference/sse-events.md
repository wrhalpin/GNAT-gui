# SSE job events reference

Long-running operations (investigation build, node expand, gap detection, report drafting, rule test) return a `job_id` immediately. Progress is delivered via Server-Sent Events at:

```
GET /api/jobs/{job_id}/stream
```

A synchronous poll fallback is also available:

```
GET /api/jobs/{job_id}
```

---

## Opening a stream (frontend)

```typescript
import { openJobStream } from "@/lib/sse";

openJobStream(jobId, {
  onProgress: (event) => {
    console.log(event.progress, event.message);
  },
  onResult: (event) => {
    console.log(event.result);
  },
  onError: (event) => {
    console.error(event.error);
  },
  onDone: (event) => {
    console.log("Job finished with status:", event.status);
  },
});
```

`openJobStream` wraps the browser `EventSource` API and handles reconnection automatically.

---

## Event types

### `progress`

Emitted as the job advances through pipeline stages.

```json
{
  "type": "progress",
  "job_id": "abc123",
  "progress": 0.5,
  "message": "Correlating…"
}
```

| Field | Type | Description |
|---|---|---|
| `type` | `"progress"` | Discriminator |
| `job_id` | `str` | The job identifier |
| `progress` | `float` | Fraction complete, 0.0–1.0 |
| `message` | `str` | Human-readable stage description |

### `result`

Emitted when the job produces an intermediate or partial result. May be emitted multiple times (e.g. once per graph node during an expand operation).

```json
{
  "type": "result",
  "job_id": "abc123",
  "result": { "node_id": "indicator--xyz", "type": "indicator" }
}
```

| Field | Type | Description |
|---|---|---|
| `type` | `"result"` | Discriminator |
| `job_id` | `str` | The job identifier |
| `result` | `object` | Partial result payload; shape varies by job type |

### `error`

Emitted if the job encounters an unrecoverable error.

```json
{
  "type": "error",
  "job_id": "abc123",
  "error": "GNAT core raised ValueError: seed not found"
}
```

| Field | Type | Description |
|---|---|---|
| `type` | `"error"` | Discriminator |
| `job_id` | `str` | The job identifier |
| `error` | `str` | Error message |

### `done`

Emitted once when the job reaches a terminal state (success or failure). The SSE stream closes after this event.

```json
{
  "type": "done",
  "job_id": "abc123",
  "status": "success",
  "result": { "investigation_id": "inv-456" }
}
```

| Field | Type | Description |
|---|---|---|
| `type` | `"done"` | Discriminator |
| `job_id` | `str` | The job identifier |
| `status` | `"success" \| "failed" \| "cancelled"` | Terminal state |
| `result` | `object \| null` | Final result payload on success |
| `error` | `str \| null` | Error message on failure |

---

## Job types and their result shapes

| Job type | Registered as | Final `result` shape |
|---|---|---|
| Investigation build | `build_investigation` | `{ "investigation_id": str }` |
| Node expand | `expand_node` | `{ "added_nodes": int, "added_edges": int }` |
| Gap detection | `gap_detection` | `{ "gaps": [GapItem, ...] }` |
| Report draft | `report_draft` | `{ "report_id": str, "sections": {...} }` |
| Rule test | `test_rule` | `{ "matched": bool, "details": [DetailItem, ...] }` |

---

## Poll fallback

If SSE is unavailable (e.g. behind a proxy that buffers responses), poll the job status endpoint instead:

```
GET /api/jobs/{job_id}
```

Response:

```json
{
  "job_id": "abc123",
  "status": "running",
  "progress": 0.6,
  "message": "Correlating…",
  "result": null,
  "error": null
}
```

The `status` field values: `pending`, `running`, `success`, `failed`, `cancelled`.

---

## SSE infrastructure notes

- The Nginx production config has `proxy_buffering off` to ensure SSE events are flushed immediately
- The SSE bridge polls `gnat.jobs.JobStore` every 250 ms; maximum per-event latency is therefore ~250 ms
- A client that disconnects mid-stream does not cancel the job; the job continues running in the background
