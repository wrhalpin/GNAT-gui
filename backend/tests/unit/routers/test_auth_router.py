from unittest.mock import MagicMock, patch

import pytest

from gnat_gui.main import create_app
from tests.conftest import CSRFClient


@pytest.fixture
def client():
    return CSRFClient(create_app(), raise_server_exceptions=True)


def test_login_calls_auth_service(client):
    mock_user = MagicMock()
    mock_user.id = "u1"
    mock_user.username = "analyst"
    mock_user.role.name = "analyst"

    mock_session = MagicMock()
    mock_session.token = "tok"
    from datetime import datetime, timezone, timedelta
    mock_session.expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

    with patch("gnat_gui.routers.auth.AuthService") as MockAuth:
        MockAuth.return_value.login.return_value = (mock_user, mock_session)
        resp = client.post("/api/auth/login", json={"username": "analyst", "password": "pass"})

    assert resp.status_code == 200
    assert resp.json()["username"] == "analyst"


def test_me_requires_session(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_logout_clears_cookie(client):
    mock_user = MagicMock()
    mock_user.id = "u1"
    mock_user.username = "admin"
    mock_user.role.name = "admin"
    mock_user.permissions = []

    mock_session = MagicMock()
    mock_session.token = "tok"
    from datetime import datetime, timezone, timedelta
    mock_session.expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

    with patch("gnat_gui.routers.auth.AuthService") as MockAuth:
        MockAuth.return_value.login.return_value = (mock_user, mock_session)
        client.post("/api/auth/login", json={"username": "admin", "password": "pass"})

    with patch("gnat_gui.routers.auth.AuthService") as MockAuth:
        MockAuth.return_value.logout.return_value = None
        resp = client.post("/api/auth/logout")

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
