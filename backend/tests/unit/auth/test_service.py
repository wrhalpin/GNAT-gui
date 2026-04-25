import pytest
from fastapi import HTTPException
from unittest.mock import MagicMock

from gnat_gui.auth.password import hash_password
from gnat_gui.auth.service import AuthService
from gnat_gui.db.models.role import Role
from gnat_gui.db.models.user import User


@pytest.fixture
def mock_audit():
    return MagicMock()


@pytest.fixture
def user_with_role(db):
    from gnat_gui.rbac.permissions import ROLE_PERMISSIONS
    role = Role(name="analyst", permissions=ROLE_PERMISSIONS["analyst"])
    db.add(role)
    db.flush()
    user = User(username="testuser", hashed_password=hash_password("validpassword123"), role_id=role.id)
    db.add(user)
    db.commit()
    return user


def test_login_success(db, user_with_role, mock_audit):
    svc = AuthService(db, mock_audit)
    user, session = svc.login("testuser", "validpassword123")
    assert user.username == "testuser"
    assert session.token is not None
    assert not session.revoked


def test_login_wrong_password(db, user_with_role, mock_audit):
    svc = AuthService(db, mock_audit)
    with pytest.raises(HTTPException) as exc:
        svc.login("testuser", "wrongpassword")
    assert exc.value.status_code == 401


def test_login_unknown_user(db, mock_audit):
    svc = AuthService(db, mock_audit)
    with pytest.raises(HTTPException) as exc:
        svc.login("nobody", "anything")
    assert exc.value.status_code == 401


def test_logout_revokes_session(db, user_with_role, mock_audit):
    svc = AuthService(db, mock_audit)
    _, session = svc.login("testuser", "validpassword123")
    db.commit()
    svc.logout(session.token)
    db.commit()
    assert session.revoked
