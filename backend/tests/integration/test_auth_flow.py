def test_login_and_me(client, seeded_db):
    resp = client.post(
        "/api/auth/login", json={"username": "admin", "password": "adminpassword123"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == "admin"
    assert data["role"] == "admin"

    me = client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["username"] == "admin"


def test_logout_then_me_returns_401(client, seeded_db):
    client.post("/api/auth/login", json={"username": "admin", "password": "adminpassword123"})
    client.post("/api/auth/logout")
    me = client.get("/api/auth/me")
    assert me.status_code == 401


def test_wrong_password_returns_401(client, seeded_db):
    resp = client.post("/api/auth/login", json={"username": "admin", "password": "wrong"})
    assert resp.status_code == 401


def test_unauthenticated_me_returns_401(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401
