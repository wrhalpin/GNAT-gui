"""RBAC fuzz: every state-changing endpoint must reject lower-privilege roles.

With CSRF handled by the test client and the rate limiter disabled (see conftest),
a 403 here is a genuine RBAC denial rather than a CSRF/429 artifact.
"""

from unittest.mock import MagicMock, patch

import pytest

ADMIN_ONLY_ROUTES = [
    ("GET", "/api/admin/users"),
    ("POST", "/api/admin/users"),
    ("GET", "/api/admin/audit"),
]

# (method, path, body) that require analyst-or-above; viewer must be denied.
ANALYST_WRITE_ROUTES = [
    ("POST", "/api/analysis/investigations", {"title": "x"}),
    ("POST", "/api/rules", {"name": "x", "engine": "yaml", "content": ""}),
]


def _login(client, username, password):
    r = client.post("/api/auth/login", json={"username": username, "password": password})
    assert r.status_code == 200, f"Login failed for {username}: {r.text}"


@pytest.mark.parametrize("method,path", ADMIN_ONLY_ROUTES)
def test_analyst_cannot_access_admin_route(client, seeded_db, method, path):
    _login(client, "analyst", "analystpassword123")
    r = getattr(client, method.lower())(path)
    assert r.status_code == 403, f"Expected 403 for analyst on {method} {path}, got {r.status_code}"


@pytest.mark.parametrize("method,path", ADMIN_ONLY_ROUTES)
def test_admin_can_access_admin_route(client, seeded_db, method, path):
    _login(client, "admin", "adminpassword123")
    kwargs = {}
    if method == "POST":
        kwargs["json"] = {"username": "fuzz_new", "password": "strongpassword123", "role": "viewer"}
    r = getattr(client, method.lower())(path, **kwargs)
    assert r.status_code != 403, f"Admin unexpectedly got 403 on {method} {path}: {r.text}"


@pytest.mark.parametrize("method,path,body", ANALYST_WRITE_ROUTES)
def test_viewer_cannot_write(client, seeded_db, method, path, body):
    _login(client, "viewer", "viewerpassword123")
    with (
        patch("gnat_gui.services.analysis_facade.AnalysisFacade._load_service") as ma,
        patch("gnat_gui.services.rules_facade.RulesFacade._load_service") as mr,
    ):
        ma.return_value = MagicMock()
        mr.return_value = MagicMock()
        r = getattr(client, method.lower())(path, json=body)
    assert r.status_code == 403, f"Viewer should be denied {method} {path}, got {r.status_code}"


@pytest.mark.parametrize("method,path,body", ANALYST_WRITE_ROUTES)
def test_analyst_allowed_to_write(client, seeded_db, method, path, body):
    _login(client, "analyst", "analystpassword123")
    with (
        patch("gnat_gui.services.analysis_facade.AnalysisFacade._load_service") as ma,
        patch("gnat_gui.services.rules_facade.RulesFacade._load_service") as mr,
    ):
        created = MagicMock()
        created.id = "obj1"
        ma.return_value = MagicMock()
        ma.return_value.create_investigation.return_value = created
        mr.return_value = MagicMock()
        mr.return_value.create_rule.return_value = created
        r = getattr(client, method.lower())(path, json=body)
    assert r.status_code != 403, (
        f"Analyst should be allowed {method} {path}, got {r.status_code}: {r.text}"
    )
