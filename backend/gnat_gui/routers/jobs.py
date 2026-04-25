from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from gnat_gui.deps import CurrentUser
from gnat_gui.schemas.ui import JobStatusResponse
from gnat_gui.streaming.sse import job_event_generator

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.get("/{job_id}/stream")
async def stream_job(job_id: str, current_user: CurrentUser) -> StreamingResponse:
    return StreamingResponse(
        job_event_generator(job_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/{job_id}", response_model=JobStatusResponse)
def get_job(job_id: str, current_user: CurrentUser) -> JobStatusResponse:
    from gnat.jobs.store import JobStore  # type: ignore[import]
    from fastapi import HTTPException, status

    store = JobStore()
    job = store.get(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    return JobStatusResponse(
        job_id=job.id,
        status=job.status.value,
        progress=getattr(job, "progress", None),
        message=getattr(job, "message", None),
        result=job.result,
        error=job.error,
    )
