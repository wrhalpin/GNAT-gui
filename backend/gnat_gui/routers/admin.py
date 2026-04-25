from fastapi import APIRouter, Query
from sqlalchemy.orm import Session

from gnat_gui.audit.service import AuditService
from gnat_gui.audit.events import AuditAction
from gnat_gui.auth.password import hash_password
from gnat_gui.db.models.audit import AuditEvent
from gnat_gui.db.models.role import Role
from gnat_gui.db.models.user import User
from gnat_gui.deps import Audit, CurrentUser, DB
from gnat_gui.rbac.decorators import require_permission
from gnat_gui.rbac.permissions import Permission
from gnat_gui.schemas.admin import (
    AuditEventResponse,
    AuditListResponse,
    UserCreate,
    UserResponse,
    UserUpdate,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/users", response_model=UserResponse)
def create_user(
    body: UserCreate,
    db: DB,
    audit: Audit,
    current_user: CurrentUser = require_permission(Permission.ADMIN_USERS),
) -> UserResponse:
    role = db.query(Role).filter_by(name=body.role).first()
    if not role:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown role: {body.role}")

    user = User(
        username=body.username,
        hashed_password=hash_password(body.password),
        role_id=role.id,
    )
    db.add(user)
    db.flush()
    audit.record(
        AuditAction.USER_CREATED,
        user_id=current_user.id,
        username=current_user.username,
        target_id=user.id,
        target_type="user",
    )
    db.commit()
    return UserResponse(
        user_id=user.id,
        username=user.username,
        role=role.name,
        is_active=user.is_active,
        created_at=user.created_at,
    )


@router.get("/users", response_model=list[UserResponse])
def list_users(
    db: DB,
    current_user: CurrentUser = require_permission(Permission.ADMIN_USERS),
) -> list[UserResponse]:
    users = db.query(User).all()
    return [
        UserResponse(
            user_id=u.id,
            username=u.username,
            role=u.role.name,
            is_active=u.is_active,
            created_at=u.created_at,
        )
        for u in users
    ]


@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    body: UserUpdate,
    db: DB,
    audit: Audit,
    current_user: CurrentUser = require_permission(Permission.ADMIN_USERS),
) -> UserResponse:
    from fastapi import HTTPException, status
    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if body.role is not None:
        role = db.query(Role).filter_by(name=body.role).first()
        if not role:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown role: {body.role}")
        user.role_id = role.id
    if body.is_active is not None:
        user.is_active = body.is_active
    audit.record(
        AuditAction.USER_UPDATED,
        user_id=current_user.id,
        username=current_user.username,
        target_id=user.id,
        target_type="user",
    )
    db.commit()
    return UserResponse(
        user_id=user.id,
        username=user.username,
        role=user.role.name,
        is_active=user.is_active,
        created_at=user.created_at,
    )


@router.get("/audit", response_model=AuditListResponse)
def list_audit(
    db: DB,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user: CurrentUser = require_permission(Permission.AUDIT_READ),
) -> AuditListResponse:
    total = db.query(AuditEvent).count()
    events = (
        db.query(AuditEvent)
        .order_by(AuditEvent.timestamp.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return AuditListResponse(
        items=[
            AuditEventResponse(
                id=e.id,
                user_id=e.user_id,
                username=e.username,
                action=e.action,
                target_id=e.target_id,
                target_type=e.target_type,
                source_ip=e.source_ip,
                timestamp=e.timestamp,
            )
            for e in events
        ],
        total=total,
        page=page,
        page_size=page_size,
    )
