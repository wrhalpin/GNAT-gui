from unittest.mock import MagicMock, patch


def _login_analyst(client, seeded_db):
    client.post("/api/auth/login", json={"username": "analyst", "password": "analystpassword123"})


def test_submit_build_returns_job_id(client, seeded_db):
    _login_analyst(client, seeded_db)

    with patch("gnat_gui.services.investigations_facade.JobRunner") as MockRunner, \
         patch("gnat_gui.services.investigations_facade.JobStore"):
        mock_job = MagicMock()
        mock_job.id = "job123"
        MockRunner.return_value.submit.return_value = mock_job
        resp = client.post(
            "/api/investigations",
            json={"seeds": [{"type": "indicator", "value": "8.8.8.8"}]},
        )

    assert resp.status_code == 200
    assert resp.json()["job_id"] == "job123"


def test_analyst_cannot_materialize(client, seeded_db):
    _login_analyst(client, seeded_db)

    with patch("gnat_gui.services.investigations_facade.InvestigationsFacade.materialize") as m:
        m.side_effect = Exception("should not reach")
        resp = client.post("/api/investigations/inv1/materialize")

    # analyst lacks investigation.materialize permission → 403
    assert resp.status_code == 403
