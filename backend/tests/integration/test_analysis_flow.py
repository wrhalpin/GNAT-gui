from unittest.mock import MagicMock, patch


def _login(client, username="analyst", password="analystpassword123"):
    r = client.post("/api/auth/login", json={"username": username, "password": password})
    assert r.status_code == 200, r.text


def test_analyst_can_create_investigation(client, seeded_db):
    _login(client)
    mock_inv = MagicMock()
    mock_inv.id = "inv1"
    mock_inv.title = "Test"
    mock_inv.status = "OPEN"

    with patch("gnat_gui.services.analysis_facade.AnalysisFacade._load_service") as m:
        svc = MagicMock()
        svc.create_investigation.return_value = mock_inv
        m.return_value = svc
        resp = client.post("/api/analysis/investigations", json={"title": "Test"})

    assert resp.status_code == 200


def test_viewer_can_list_investigations(client, seeded_db):
    _login(client, "viewer", "viewerpassword123")
    with patch("gnat_gui.services.analysis_facade.AnalysisFacade._load_service") as m:
        svc = MagicMock()
        svc.list_investigations.return_value = []
        m.return_value = svc
        resp = client.get("/api/analysis/investigations")

    assert resp.status_code == 200


def test_viewer_cannot_create_investigation(client, seeded_db):
    _login(client, "viewer", "viewerpassword123")
    with patch("gnat_gui.services.analysis_facade.AnalysisFacade._load_service") as m:
        m.return_value = MagicMock()
        resp = client.post("/api/analysis/investigations", json={"title": "x"})
    assert resp.status_code == 403
