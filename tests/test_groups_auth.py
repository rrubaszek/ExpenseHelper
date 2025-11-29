from fastapi.testclient import TestClient
from app.main import app


import uuid


def test_register_login_create_group():
    client = TestClient(app)

    # register (use unique email to avoid conflicts with previous test runs)
    test_email = f"{uuid.uuid4().hex}@example.com"
    r = client.post("/users/register", json={"email": test_email, "password": "abcdef", "name": "A"})
    assert r.status_code == 200

    # login
    r = client.post("/users/token", data={"username": "a@b.com", "password": "abcdef"})
    assert r.status_code == 200
    body = r.json()
    assert "access_token" in body
    assert body.get("token_type") == "bearer"
    token = body["access_token"]

    # create group with Authorization header
    headers = {"Authorization": f"Bearer {token}"}
    group_payload = {"name": "party", "description": "desc", "member_ids": []}
    r = client.post("/groups/", json=group_payload, headers=headers)
    # expect 200 OK
    assert r.status_code == 200, f"expected 200 but got {r.status_code}, body={r.text}"


def test_openapi_token_url():
    client = TestClient(app)
    o = client.get("/openapi.json").json()
    # verify the oauth2 tokenUrl points at the users token endpoint
    flows = o["components"]["securitySchemes"]["OAuth2PasswordBearer"]["flows"]
    assert flows["password"]["tokenUrl"] == "/users/token"
