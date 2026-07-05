"""Assert that state-changing routes produce the expected audit events."""

from unittest.mock import patch

from gnat_gui.audit.events import AuditAction


def _action_of(mock_record):
    args = mock_record.call_args
    return args[0][0] if args[0] else args[1].get("action")


def _login(client, username, password):
    r = client.post("/api/auth/login", json={"username": username, "password": password})
    assert r.status_code == 200, r.text


def test_login_produces_audit_event(client, seeded_db):
    with patch("gnat_gui.auth.service.AuditService.record") as mock_record:
        _login(client, "admin", "adminpassword123")
        mock_record.assert_called_once()
        assert _action_of(mock_record) == AuditAction.LOGIN


def test_logout_produces_audit_event(client, seeded_db):
    _login(client, "admin", "adminpassword123")
    with patch("gnat_gui.auth.service.AuditService.record") as mock_record:
        r = client.post("/api/auth/logout")
        assert r.status_code == 200
        mock_record.assert_called_once()
        assert _action_of(mock_record) == AuditAction.LOGOUT


def test_user_create_produces_audit_event(client, seeded_db):
    _login(client, "admin", "adminpassword123")
    with patch("gnat_gui.audit.service.AuditService.record") as mock_record:
        r = client.post(
            "/api/admin/users",
            json={"username": "newuser_audit", "password": "strongpassword99", "role": "analyst"},
        )
        assert r.status_code == 200, r.text
        actions = [
            (c.args[0] if c.args else c.kwargs.get("action")) for c in mock_record.call_args_list
        ]
        assert AuditAction.USER_CREATED in actions


def test_failed_login_produces_audit_event(client, seeded_db):
    with patch("gnat_gui.auth.service.AuditService.record") as mock_record:
        r = client.post("/api/auth/login", json={"username": "admin", "password": "wrongpassword"})
        assert r.status_code == 401
        mock_record.assert_called_once()
        assert _action_of(mock_record) == AuditAction.LOGIN_FAILED


def test_permission_denied_is_audited(client, seeded_db):
    """A facade-level RBAC denial records PERMISSION_DENIED."""
    _login(client, "viewer", "viewerpassword123")
    with patch("gnat_gui.audit.service.AuditService.record") as mock_record:
        from unittest.mock import MagicMock

        with patch("gnat_gui.services.rules_facade.RulesFacade._load_service") as m:
            m.return_value = MagicMock()
            r = client.post("/api/rules", json={"name": "x", "engine": "yaml", "content": ""})
        assert r.status_code == 403
        actions = [
            (c.args[0] if c.args else c.kwargs.get("action")) for c in mock_record.call_args_list
        ]
        assert AuditAction.PERMISSION_DENIED in actions
