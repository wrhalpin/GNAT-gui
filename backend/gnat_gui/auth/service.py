import secrets
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from gnat_gui.audit.events import AuditAction
from gnat_gui.audit.service import AuditService
from gnat_gui.auth.password import dummy_verify, verify_password
from gnat_gui.config import settings
from gnat_gui.db.models.session import UserSession
from gnat_gui.db.models.user import User
from gnat_gui.rbac.permissions import ROLE_PERMISSIONS


class AuthService:
    def __init__(self, db: Session, audit: AuditService) -> None:
        self._db = db
        self._audit = audit

    def login(
        self, username: str, password: str, source_ip: str | None = None
    ) -> tuple[User, UserSession]:
        user = self._db.query(User).filter_by(username=username, is_active=True).first()
        if not user:
            # Equalize timing with the real-verification path so response latency
            # doesn't disclose whether the username exists.
            dummy_verify()
            credentials_ok = False
        else:
            credentials_ok = verify_password(password, user.hashed_password)
        if not user or not credentials_ok:
            self._audit.record(AuditAction.LOGIN_FAILED, username=username, source_ip=source_ip)
            self._db.commit()  # failed-login audit must survive the 401
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        session = UserSession(
            user_id=user.id,
            token=secrets.token_urlsafe(32),
            expires_at=datetime.now(UTC) + timedelta(seconds=settings.session_expire_seconds),
            source_ip=source_ip,
        )
        self._db.add(session)
        self._db.flush()

        self._audit.record(
            AuditAction.LOGIN, user_id=user.id, username=user.username, source_ip=source_ip
        )
        return user, session

    def logout(self, token: str) -> None:
        session = self._db.query(UserSession).filter_by(token=token, revoked=False).first()
        if session:
            session.revoked = True
            self._audit.record(
                AuditAction.LOGOUT, user_id=session.user_id, source_ip=session.source_ip
            )
            self._db.flush()

    def get_session_user(self, token: str) -> tuple[User, list[str]]:
        now = datetime.now(UTC)
        session = (
            self._db.query(UserSession)
            .filter(
                UserSession.token == token,
                UserSession.revoked.is_(False),
                UserSession.expires_at > now,
            )
            .first()
        )
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired or invalid"
            )
        user = session.user
        if not user.is_active:
            # Deactivation must cut off access immediately, even for sessions
            # issued before the account was disabled.
            session.revoked = True
            self._db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Account is deactivated"
            )
        # Role permissions are read from the seeded role row so DB edits take
        # effect; the hardcoded map is only a fallback for unseeded roles.
        permissions = user.role.permissions or ROLE_PERMISSIONS.get(user.role.name, [])
        return user, permissions
