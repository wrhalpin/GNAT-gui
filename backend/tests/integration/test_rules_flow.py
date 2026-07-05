from unittest.mock import MagicMock, patch


def _login(client, username="analyst", password="analystpassword123"):
    r = client.post("/api/auth/login", json={"username": username, "password": password})
    assert r.status_code == 200, r.text


def test_analyst_can_create_rule(client, seeded_db):
    _login(client)
    mock_rule = MagicMock()
    mock_rule.id = "r1"
    mock_rule.name = "test-rule"

    with patch("gnat_gui.services.rules_facade.RulesFacade._load_service") as m:
        svc = MagicMock()
        svc.create_rule.return_value = mock_rule
        m.return_value = svc
        resp = client.post("/api/rules", json={"name": "test-rule", "engine": "yaml", "content": ""})

    assert resp.status_code == 200


def test_viewer_cannot_create_rule(client, seeded_db):
    _login(client, "viewer", "viewerpassword123")
    with patch("gnat_gui.services.rules_facade.RulesFacade._load_service") as m:
        m.return_value = MagicMock()
        resp = client.post("/api/rules", json={"name": "x", "engine": "yaml", "content": ""})
    # viewer role lacks rule.create → RBAC denies before the service is touched
    assert resp.status_code == 403


def test_analyst_can_submit_test(client, seeded_db):
    _login(client)
    # The fake gnat JobRunner (see conftest) returns a job with a stable id, so no
    # patching of the inline gnat.jobs import is needed.
    with patch("gnat_gui.services.rules_facade.RulesFacade._load_service") as m:
        m.return_value = MagicMock()
        resp = client.post("/api/rules/r1/test", json={"fixture": {"indicators": []}})

    assert resp.status_code == 200
    assert "job_id" in resp.json()
