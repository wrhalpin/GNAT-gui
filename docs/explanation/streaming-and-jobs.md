# Streaming and jobs

This document explains how GNAT-gui bridges GNAT's synchronous job system to the browser via Server-Sent Events (SSE), and what design choices this imposed.

---

## The problem

GNAT core runs analysis operations — investigation builds, node expansion, gap detection, report drafting, rule tests — synchronously in a thread pool (`gnat.jobs.JobRunner` uses `ThreadPoolExecutor`). These jobs can take seconds to minutes.

A simple approach would be to block the HTTP request until the job finishes. This fails in practice because:

- Browser HTTP connections time out after ~30–60 seconds
- The user gets no feedback during the wait
- A single slow job holds a FastAPI worker thread

---

## The solution: submit-and-stream

Every long-running operation is split into two HTTP calls:

1. **Submit** (`POST /api/.../build`, etc.) — starts the job and returns `{ job_id }` in milliseconds
2. **Stream** (`GET /api/jobs/{job_id}/stream`) — opens an SSE connection that delivers progress events as they are emitted by the job

```
Browser                     FastAPI                     GNAT core
   |                           |                            |
   |--- POST /build ---------> |                            |
   |                           |--- JobRunner.submit() ---> |
   |                           | <-- job_id (immediate) --- |
   | <-- { job_id } ---------- |                            |
   |                           |          (job runs in thread)
   |--- GET /jobs/id/stream -> |                            |
   |                           |<-- poll JobStore (250ms) ->|
   | <-- progress: 10% ------- |                            |
   | <-- progress: 50% ------- |                            |
   | <-- result: {...} ------- |                            |
   | <-- done: success ------- |                            |
   |                           |                            |
```

---

## The SSE bridge

`gnat_gui/streaming/sse.py` implements an async generator that bridges the synchronous `JobStore` to the async FastAPI response:

```python
async def job_event_generator(job_id: str) -> AsyncGenerator[str, None]:
    store = JobStore()
    last_seen = 0

    while True:
        job = store.get(job_id)
        events = getattr(job, "events", [])

        for evt in events[last_seen:]:
            payload = {**evt.to_dict(), "type": _event_type(evt), "job_id": job_id}
            yield f"data: {json.dumps(payload)}\n\n"
            last_seen += 1

        if job.is_terminal:
            yield f"data: {json.dumps({'type': 'done', 'status': job.status.value, ...})}\n\n"
            return

        await asyncio.sleep(0.25)   # yield to event loop, poll again in 250ms
```

The key insight is `await asyncio.sleep(0.25)`: it yields control back to FastAPI's event loop while the job thread runs, so the server remains fully concurrent despite polling a synchronous data structure.

---

## gnat.jobs: the job registry and runner

GNAT's job system has three parts:

- **`@job(name)` decorator** — registers a handler function in the job registry
- **`JobRunner.submit(name, payload)`** — looks up the handler, runs it in a `ThreadPoolExecutor`, returns a `job_id`
- **`JobStore.get(job_id)`** — retrieves the current job state including all emitted events

GNAT-gui registers its job handlers in `gnat_gui/jobs.py`:

```python
@job("build_investigation")
def build_investigation_job(payload, progress_cb, cancel):
    from gnat.investigations.builder import InvestigationBuilder
    builder = InvestigationBuilder()
    result = builder.build_with_progress(
        seeds=payload["seeds"],
        progress_callback=lambda p, msg: progress_cb(p, msg),
    )
    return {"investigation_id": result.id}
```

The `progress_cb(fraction, message)` call appends a `ProgressEvent` to the job's event list, which the SSE bridge picks up on the next poll.

---

## Progress callback pattern

Every GNAT core operation that supports streaming accepts a `progress_callback` parameter with the signature `(fraction: float, message: str) -> None`. The job handler wraps this as:

```python
lambda p, msg: progress_cb(p, msg)
```

`progress_cb` is provided by the `JobRunner` and appends a `gnat.streaming.ProgressEvent` to the job's internal event queue.

---

## Event types

| GNAT type | SSE `type` field |
|---|---|
| `gnat.streaming.ProgressEvent` | `"progress"` |
| `gnat.streaming.ResultEvent` | `"result"` |
| `gnat.streaming.ErrorEvent` | `"error"` |
| Terminal state (job complete) | `"done"` |

See [SSE events reference](../reference/sse-events.md) for full event shapes.

---

## Why not WebSockets?

SSE is simpler than WebSockets for one-directional server-to-client streaming:

- SSE is a plain HTTP response; no protocol upgrade
- Native browser reconnection (`EventSource` auto-reconnects on network drop)
- No additional server infrastructure (no WebSocket server required)
- The Nginx `proxy_buffering off` directive is sufficient to make SSE work through a proxy

The only limitation is that SSE is one-directional. GNAT-gui does not need client-to-server communication mid-stream (cancellation is not yet implemented), so this is not a constraint.

---

## What happens if the browser disconnects mid-stream?

The job continues running in the thread pool. When the browser reconnects and reopens the SSE stream for the same `job_id`, the bridge replays all events from the beginning of the event list (because `last_seen` starts at 0). The frontend deduplicates events by tracking the last seen progress value.

If the job has already finished, the bridge emits all historical events and then immediately emits `done`.

---

## Cancellation

Job cancellation is not yet implemented. The `cancel` parameter in job handlers is reserved for future use. Once GNAT core's `JobRunner` supports cancellation tokens, the bridge can accept a `DELETE /api/jobs/{id}` request and signal the running thread.
