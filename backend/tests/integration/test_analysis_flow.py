from unittest.mock import MagicMock, patch

from gnat_gui.rbac.permissions import ROLE_PERMISSIONS


def _login(client, seeded_db, username="analyst", password="analystpassword123"):
    client.post("/api/auth/login", json={"username": username, "password": password})


def test_analyst_can_create_investigation(client, seeded_db):
    _login(client, seeded_db)
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
    from gnat_gui.db.models.role import Role
    from gnat_gui.db.models.user import User
    from gnat_gui.auth.password import hash_password

    db = next(client.app.dependency_overrides.values())()
    viewer_role = db.query(Role).filter_by(name="viewer").first()
    if viewer_role:
        viewer = User(
            username="viewer1",
            hashed_password=hash_password("viewerpassword123"),
            role_id=viewer_role.id,
        )
        db.add(viewer)
        db.commit()

    client.post("/api/auth/login", json={"username": "viewer1", "password": "viewerpassword123"})

    with patch("gnat_gui.services.analysis_facade.AnalysisFacade._load_service") as m:
        svc = MagicMock()
        svc.list_investigations.return_value = []
        m.return_value = svc
        resp = client.get("/api/analysis/investigations")

    assert resp.status_code == 200
