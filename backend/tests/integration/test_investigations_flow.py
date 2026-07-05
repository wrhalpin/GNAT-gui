def _login(client, username="analyst", password="analystpassword123"):
    r = client.post("/api/auth/login", json={"username": username, "password": password})
    assert r.status_code == 200, r.text


def test_submit_build_returns_job_id(client, seeded_db):
    _login(client)
    # analyst has investigation.create; the fake gnat JobRunner returns a job id.
    resp = client.post(
        "/api/investigations",
        json={"seeds": [{"type": "indicator", "value": "8.8.8.8"}]},
    )
    assert resp.status_code == 200
    assert "job_id" in resp.json()


def test_analyst_cannot_materialize(client, seeded_db):
    _login(client)
    # analyst lacks investigation.materialize; the facade's RBAC check must deny
    # with 403 before any GNAT service is touched (nothing is patched here).
    resp = client.post("/api/investigations/inv1/materialize")
    assert resp.status_code == 403


def test_senior_can_materialize(client, seeded_db):
    from unittest.mock import patch

    _login(client, "senior", "seniorpassword123")
    with patch(
        "gnat.analyst_services.investigations.InvestigationsService"
    ) as MockSvc:
        MockSvc.return_value.materialize.return_value = {"status": "materialized"}
        resp = client.post("/api/investigations/inv1/materialize")
    assert resp.status_code == 200
