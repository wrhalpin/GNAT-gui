from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from gnat_gui.main import create_app
from gnat_gui.rbac.permissions import ROLE_PERMISSIONS


def _make_user(role: str):
    u = MagicMock()
    u.id = "uid"
    u.username = role
    u.role.name = role
    u.permissions = ROLE_PERMISSIONS.get(role, [])
    return u


@pytest.fixture
def admin_client():
    app = create_app()
    app.dependency_overrides[
        __import__("gnat_gui.deps", fromlist=["get_current_user"]).get_current_user
    ] = lambda: _make_user("admin")
    return TestClient(app)


@pytest.fixture
def analyst_client():
    app = create_app()
    app.dependency_overrides[
        __import__("gnat_gui.deps", fromlist=["get_current_user"]).get_current_user
    ] = lambda: _make_user("analyst")
    return TestClient(app)


def test_analyst_cannot_list_users(analyst_client):
    resp = analyst_client.get("/api/admin/users")
    assert resp.status_code == 403


def test_analyst_cannot_read_audit(analyst_client):
    resp = analyst_client.get("/api/admin/audit")
    assert resp.status_code == 403
