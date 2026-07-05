"""Regression tests for the milestone-2 security fixes."""

from unittest.mock import MagicMock, patch


def _login(client, username, password):
    r = client.post("/api/auth/login", json={"username": username, "password": password})
    assert r.status_code == 200, r.text


def test_deactivation_revokes_access_immediately(client, seeded_db):
    # analyst logs in and holds a valid session
    _login(client, "analyst", "analystpassword123")
    assert client.get("/api/auth/me").status_code == 200

    analyst_id = seeded_db["analyst"].id

    # admin deactivates the analyst (separate client so cookies don't collide)
    from tests.conftest import CSRFClient

    admin = CSRFClient(client.app)
    admin.post("/api/auth/login", json={"username": "admin", "password": "adminpassword123"})
    r = admin.patch(f"/api/admin/users/{analyst_id}", json={"is_active": False})
    assert r.status_code == 200

    # the analyst's existing session is now dead
    assert client.get("/api/auth/me").status_code == 401


def test_analyst_cannot_update_another_analysts_investigation(client, seeded_db):
    # analyst (owner) creates an investigation; the GUI records ownership
    _login(client, "analyst", "analystpassword123")
    owned = MagicMock()
    owned.id = "inv-owned"
    with patch("gnat_gui.services.analysis_facade.AnalysisFacade._load_service") as m:
        svc = MagicMock()
        svc.create_investigation.return_value = owned
        m.return_value = svc
        assert (
            client.post("/api/analysis/investigations", json={"title": "mine"}).status_code == 200
        )

    # a different analyst tries to PATCH it — they hold only update.own, and they
    # are not the owner, so the .own/.any check must deny with 403.
    other = client  # reuse app; log in as a second analyst account
    # create a second analyst via admin
    from tests.conftest import CSRFClient

    admin = CSRFClient(client.app)
    admin.post("/api/auth/login", json={"username": "admin", "password": "adminpassword123"})
    admin.post(
        "/api/admin/users",
        json={"username": "analyst2", "password": "analyst2password", "role": "analyst"},
    )

    other = CSRFClient(client.app)
    other.post("/api/auth/login", json={"username": "analyst2", "password": "analyst2password"})
    with patch("gnat_gui.services.analysis_facade.AnalysisFacade._load_service") as m:
        m.return_value = MagicMock()
        r = other.patch("/api/analysis/investigations/inv-owned", json={"title": "hijack"})
    assert r.status_code == 403


def test_senior_analyst_can_update_any_investigation(client, seeded_db):
    # analyst creates and owns an investigation
    _login(client, "analyst", "analystpassword123")
    owned = MagicMock()
    owned.id = "inv-any"
    with patch("gnat_gui.services.analysis_facade.AnalysisFacade._load_service") as m:
        svc = MagicMock()
        svc.create_investigation.return_value = owned
        m.return_value = svc
        client.post("/api/analysis/investigations", json={"title": "mine"})

    # senior_analyst holds update.any → allowed even though they don't own it
    from tests.conftest import CSRFClient

    senior = CSRFClient(client.app)
    senior.post("/api/auth/login", json={"username": "senior", "password": "seniorpassword123"})
    with patch("gnat_gui.services.analysis_facade.AnalysisFacade._load_service") as m:
        svc = MagicMock()
        svc.update_investigation.return_value = owned
        m.return_value = svc
        r = senior.patch("/api/analysis/investigations/inv-any", json={"title": "reviewed"})
    assert r.status_code != 403
