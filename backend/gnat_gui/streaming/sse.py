import asyncio
import json
from collections.abc import AsyncGenerator

# Poll the (synchronous) JobStore this often.
POLL_INTERVAL_SECONDS = 0.25
# Emit an SSE comment line at this cadence so idle streams survive proxies.
HEARTBEAT_SECONDS = 15.0
# Absolute ceiling: a job that hasn't reached a terminal state by then gets a
# timeout event instead of an unbounded server-side loop.
MAX_STREAM_SECONDS = 3600.0


async def job_event_generator(job_id: str) -> AsyncGenerator[str, None]:
    """Poll gnat.jobs.JobStore and emit SSE events until the job is terminal.

    The store is synchronous, so reads are pushed to the default executor to
    keep the event loop responsive under many concurrent streams.
    """
    try:
        from gnat.jobs.store import JobStore  # type: ignore[import]
    except ModuleNotFoundError:
        yield _encode({"type": "error", "error": "Job system unavailable"})
        return

    store = JobStore()
    loop = asyncio.get_running_loop()
    last_seen = 0
    elapsed = 0.0
    since_heartbeat = 0.0

    while True:
        job = await loop.run_in_executor(None, store.get, job_id)
        if job is None:
            yield _encode({"type": "error", "error": f"Job {job_id} not found"})
            return

        events = getattr(job, "events", [])
        for evt in events[last_seen:]:
            yield _encode({**evt.to_dict(), "type": _event_type(evt)})
            last_seen += 1
            since_heartbeat = 0.0

        if job.is_terminal:
            payload: dict = {"type": "done", "status": job.status.value}
            if job.result:
                payload["result"] = job.result
            if job.error:
                payload["error"] = job.error
            yield _encode(payload)
            return

        if elapsed >= MAX_STREAM_SECONDS:
            yield _encode(
                {"type": "error", "error": f"Stream timed out after {int(elapsed)}s"}
            )
            return

        if since_heartbeat >= HEARTBEAT_SECONDS:
            # SSE comment line — ignored by EventSource, keeps proxies from
            # closing the idle connection.
            yield ": keepalive\n\n"
            since_heartbeat = 0.0

        await asyncio.sleep(POLL_INTERVAL_SECONDS)
        elapsed += POLL_INTERVAL_SECONDS
        since_heartbeat += POLL_INTERVAL_SECONDS


def _encode(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


def _event_type(evt: object) -> str:
    name = type(evt).__name__
    mapping = {
        "ProgressEvent": "progress",
        "TokenEvent": "token",
        "ResultEvent": "result",
        "ErrorEvent": "error",
    }
    return mapping.get(name, "event")
