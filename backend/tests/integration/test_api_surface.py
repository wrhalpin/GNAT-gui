"""Coverage for the milestone-3 API additions."""

from unittest.mock import MagicMock, patch


def _login(client, username, password):
    r = client.post("/api/auth/login", json={"username": username, "password": password})
    assert r.status_code == 200, r.text


def test_analyst_cannot_publish_report(client, seeded_db):
    _login(client, "analyst", "analystpassword123")
    with patch("gnat_gui.services.analysis_facade.AnalysisFacade._load_service") as m:
        m.return_value = MagicMock()
        r = client.post("/api/analysis/reports/rep1/publish")
    assert r.status_code == 403  # analyst lacks report.publish


def test_senior_can_publish_report(client, seeded_db):
    _login(client, "senior", "seniorpassword123")
    with patch("gnat_gui.services.analysis_facade.AnalysisFacade._load_service") as m:
        svc = MagicMock()
        svc.publish_report.return_value = {"status": "published"}
        m.return_value = svc
        r = client.post("/api/analysis/reports/rep1/publish")
    assert r.status_code == 200
    assert r.json()["status"] == "published"


def test_admin_get_user(client, seeded_db):
    _login(client, "admin", "adminpassword123")
    analyst_id = seeded_db["analyst"].id
    r = client.get(f"/api/admin/users/{analyst_id}")
    assert r.status_code == 200
    assert r.json()["username"] == "analyst"


def test_admin_get_unknown_user_404(client, seeded_db):
    _login(client, "admin", "adminpassword123")
    r = client.get("/api/admin/users/does-not-exist")
    assert r.status_code == 404


def test_audit_filter_by_action(client, seeded_db):
    # generate a couple of auditable events
    _login(client, "admin", "adminpassword123")
    client.post(
        "/api/admin/users",
        json={"username": "audituser", "password": "strongpassword123", "role": "viewer"},
    )
    # filter the audit log to only user_created events
    r = client.get("/api/admin/audit", params={"action": "admin.user_created"})
    assert r.status_code == 200
    body = r.json()
    assert body["total"] >= 1
    assert all(item["action"] == "admin.user_created" for item in body["items"])
