import asyncio
import json
from collections.abc import AsyncGenerator


async def job_event_generator(job_id: str) -> AsyncGenerator[str, None]:
    """Poll gnat.jobs.JobStore and emit SSE events until the job is terminal."""
    from gnat.jobs.store import JobStore  # type: ignore[import]

    store = JobStore()
    last_seen = 0

    while True:
        job = store.get(job_id)
        if job is None:
            yield _encode({"type": "error", "error": f"Job {job_id} not found"})
            return

        events = getattr(job, "events", [])
        for evt in events[last_seen:]:
            yield _encode({**evt.to_dict(), "type": _event_type(evt)})
            last_seen += 1

        if job.is_terminal:
            payload: dict = {"type": "done", "status": job.status.value}
            if job.result:
                payload["result"] = job.result
            if job.error:
                payload["error"] = job.error
            yield _encode(payload)
            return

        await asyncio.sleep(0.25)


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
