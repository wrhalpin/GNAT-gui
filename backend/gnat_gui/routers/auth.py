from fastapi import APIRouter, Depends, Request, Response

from gnat_gui.auth.middleware import get_session_token
from gnat_gui.auth.service import AuthService
from gnat_gui.config import settings
from gnat_gui.deps import Audit, CurrentUser, DB, SourceIP
from gnat_gui.rate_limit import limiter
from gnat_gui.schemas.auth import LoginRequest, MeResponse, SessionResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=SessionResponse)
@limiter.limit("10/minute")
def login(
    request: Request,
    body: LoginRequest,
    response: Response,
    db: DB,
    audit: Audit,
    source_ip: SourceIP,
) -> SessionResponse:
    svc = AuthService(db, audit)
    user, session = svc.login(body.username, body.password, source_ip)
    db.commit()
    response.set_cookie(
        "session",
        session.token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=settings.session_expire_seconds,
    )
    return SessionResponse(
        user_id=user.id,
        username=user.username,
        role=user.role.name,
        expires_at=session.expires_at,
    )


@router.post("/logout")
def logout(
    response: Response,
    db: DB,
    audit: Audit,
    token: str = Depends(get_session_token),
) -> dict:
    svc = AuthService(db, audit)
    svc.logout(token)
    db.commit()
    response.delete_cookie("session")
    return {"ok": True}


@router.get("/me", response_model=MeResponse)
def me(current_user: CurrentUser) -> MeResponse:
    return MeResponse(
        user_id=current_user.id,
        username=current_user.username,
        role=current_user.role.name,
        permissions=current_user.permissions,
    )
