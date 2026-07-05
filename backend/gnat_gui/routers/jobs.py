from typing import Any

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from gnat_gui.deps import CurrentUser
from gnat_gui.rbac.permissions import Permission
from gnat_gui.schemas.ui import JobStatusResponse
from gnat_gui.streaming.sse import job_event_generator

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def _get_job_authorized(job_id: str, current_user: Any) -> Any:
    """Fetch a job and enforce ownership: results can contain report drafts and
    investigation data, so only the submitter (or an admin) may read them."""
    try:
        from gnat.jobs.store import JobStore  # type: ignore[import]
    except ModuleNotFoundError:
        # Without the gnat core library no jobs can exist — report not-found
        # rather than a 500.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    job = JobStore().get(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    submitted_by = getattr(job, "submitted_by", None)
    is_admin = Permission.ADMIN_USERS in current_user.permissions
    if submitted_by is not None and submitted_by != current_user.id and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your job")
    return job


@router.get("/{job_id}/stream")
async def stream_job(job_id: str, current_user: CurrentUser) -> StreamingResponse:
    _get_job_authorized(job_id, current_user)
    return StreamingResponse(
        job_event_generator(job_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/{job_id}", response_model=JobStatusResponse)
def get_job(job_id: str, current_user: CurrentUser) -> JobStatusResponse:
    job = _get_job_authorized(job_id, current_user)
    return JobStatusResponse(
        job_id=job.id,
        status=job.status.value,
        progress=getattr(job, "progress", None),
        message=getattr(job, "message", None),
        result=job.result,
        error=job.error,
    )
