def test_admin_can_create_user(client, seeded_db):
    client.post("/api/auth/login", json={"username": "admin", "password": "adminpassword123"})
    resp = client.post(
        "/api/admin/users",
        json={"username": "newanalyst", "password": "securepassword123", "role": "analyst"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == "newanalyst"
    assert data["role"] == "analyst"


def test_analyst_cannot_create_user(client, seeded_db):
    client.post("/api/auth/login", json={"username": "analyst", "password": "analystpassword123"})
    resp = client.post(
        "/api/admin/users",
        json={"username": "another", "password": "securepassword123", "role": "viewer"},
    )
    assert resp.status_code == 403
