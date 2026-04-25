"""RBAC fuzz: every state-changing endpoint must reject lower-privilege roles."""
import pytest
from fastapi.testclient import TestClient

from gnat_gui.rbac.permissions import ROLE_PERMISSIONS


ADMIN_ONLY_ROUTES = [
    ("GET", "/api/admin/users"),
    ("POST", "/api/admin/users"),
    ("GET", "/api/admin/audit"),
]

ANALYST_AND_ABOVE_ROUTES = [
    ("GET", "/api/analysis/investigations"),
    ("POST", "/api/analysis/investigations"),
    ("GET", "/api/rules"),
    ("POST", "/api/rules"),
]


def _login(client: TestClient, username: str, password: str) -> dict:
    r = client.post("/api/auth/login", json={"username": username, "password": password})
    assert r.status_code == 200, f"Login failed for {username}: {r.text}"
    return client.cookies


@pytest.mark.parametrize("method,path", ADMIN_ONLY_ROUTES)
def test_analyst_cannot_access_admin_route(client, seeded_db, method, path):
    _login(client, "analyst", "analystpassword123")
    r = getattr(client, method.lower())(path)
    assert r.status_code == 403, f"Expected 403 for analyst on {method} {path}, got {r.status_code}"


@pytest.mark.parametrize("method,path", ADMIN_ONLY_ROUTES)
def test_admin_can_access_admin_route(client, seeded_db, method, path):
    _login(client, "admin", "adminpassword123")
    r = getattr(client, method.lower())(path)
    # 200 or 404/422 are all acceptable — what matters is NOT 403
    assert r.status_code != 403, f"Admin unexpectedly got 403 on {method} {path}"


def test_viewer_cannot_post_investigation(client, seeded_db):
    """Viewer role must be blocked from creating investigations."""
    from gnat_gui.db.models.role import Role
    from gnat_gui.db.models.user import User
    from gnat_gui.auth.password import hash_password

    # create viewer user inline
    from gnat_gui.db.session import get_db
    from tests.conftest import TestingSessionLocal

    db = TestingSessionLocal()
    viewer_role = db.query(Role).filter_by(name="viewer").first()
    if not viewer_role:
        viewer_role = Role(name="viewer", permissions=list(ROLE_PERMISSIONS.get("viewer", [])))
        db.add(viewer_role)
        db.flush()
    viewer = User(
        username="viewer_fuzz",
        hashed_password=hash_password("viewerpassword123"),
        role_id=viewer_role.id,
    )
    db.add(viewer)
    db.commit()
    db.close()

    _login(client, "viewer_fuzz", "viewerpassword123")
    r = client.post("/api/analysis/investigations", json={"title": "x", "description": "y"})
    assert r.status_code == 403
