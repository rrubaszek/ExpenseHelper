import uuid
from fastapi.testclient import TestClient
from app.main import app


def test_mark_payment():
    """Test marking a payment as completed"""
    client = TestClient(app)
    
    # register users
    user1_email = f"{uuid.uuid4().hex}@example.com"
    user2_email = f"{uuid.uuid4().hex}@example.com"
    
    r1 = client.post("/users/register", json={"email": user1_email, "password": "pass123"})
    user1_id = r1.json()["id"]
    
    r2 = client.post("/users/register", json={"email": user2_email, "password": "pass123"})
    user2_id = r2.json()["id"]
    
    # login user1
    token_resp = client.post("/users/token", data={"username": user1_email, "password": "pass123"})
    token = token_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    # create group including both users
    group_resp = client.post(
        "/groups/",
        json={"name": "payments", "description": "payments", "member_ids": [user1_id, user2_id]},
        headers=headers
    )
    group_id = group_resp.json()["id"]

    # mark payment
    payment_resp = client.post(
        "/settlements/mark-paid",
        json={
            "from_user": user1_id,
            "to_user": user2_id,
            "amount": 50.0,
            "group_id": group_id
        },
        headers=headers
    )
    assert payment_resp.status_code == 200
    data = payment_resp.json()
    assert data["status"] == "payment_recorded"
    assert data["from_user"] == user1_id
    assert data["to_user"] == user2_id
    assert data["amount"] == 50.0


def test_mark_payment_by_creditor():
    """Test that creditor can also mark payment"""
    client = TestClient(app)
    
    # register users
    user1_email = f"{uuid.uuid4().hex}@example.com"
    user2_email = f"{uuid.uuid4().hex}@example.com"
    
    r1 = client.post("/users/register", json={"email": user1_email, "password": "pass123"})
    user1_id = r1.json()["id"]
    
    r2 = client.post("/users/register", json={"email": user2_email, "password": "pass123"})
    user2_id = r2.json()["id"]
    
    # login user2 (creditor)
    token_resp = client.post("/users/token", data={"username": user2_email, "password": "pass123"})
    token = token_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    # create group including both users
    group_resp = client.post(
        "/groups/",
        json={"name": "payments2", "description": "payments", "member_ids": [user1_id, user2_id]},
        headers=headers
    )
    group_id = group_resp.json()["id"]

    # mark payment
    payment_resp = client.post(
        "/settlements/mark-paid",
        json={
            "from_user": user1_id,
            "to_user": user2_id,
            "amount": 25.0,
            "group_id": group_id
        },
        headers=headers
    )
    assert payment_resp.status_code == 200
    data = payment_resp.json()
    assert data["status"] == "payment_recorded"


def test_mark_payment_unauthorized():
    """Test that only debtor or creditor can mark payment"""
    client = TestClient(app)
    
    # register users
    user1_email = f"{uuid.uuid4().hex}@example.com"
    user2_email = f"{uuid.uuid4().hex}@example.com"
    user3_email = f"{uuid.uuid4().hex}@example.com"
    
    r1 = client.post("/users/register", json={"email": user1_email, "password": "pass123"})
    user1_id = r1.json()["id"]
    
    r2 = client.post("/users/register", json={"email": user2_email, "password": "pass123"})
    user2_id = r2.json()["id"]
    
    r3 = client.post("/users/register", json={"email": user3_email, "password": "pass123"})
    user3_id = r3.json()["id"]
    
    # login user3 (uninvolved)
    token_resp = client.post("/users/token", data={"username": user3_email, "password": "pass123"})
    token = token_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    # create group for user1 and user2 (user3 not member)
    # use user1's token to create the group
    token_resp_user1 = client.post("/users/token", data={"username": user1_email, "password": "pass123"})
    token_user1 = token_resp_user1.json()["access_token"]
    headers_user1 = {"Authorization": f"Bearer {token_user1}"}
    group_resp = client.post(
        "/groups/",
        json={"name": "payments3", "description": "payments", "member_ids": [user1_id, user2_id]},
        headers=headers_user1
    )
    group_id = group_resp.json()["id"]

    # try to mark payment between user1 and user2 by user3
    payment_resp = client.post(
        "/settlements/mark-paid",
        json={
            "from_user": user1_id,
            "to_user": user2_id,
            "amount": 50.0,
            "group_id": group_id
        },
        headers=headers
    )
    assert payment_resp.status_code == 403
    assert "Only debtor or creditor" in payment_resp.json()["detail"]


def test_mark_payment_invalid_user():
    """Test marking payment with non-existent user"""
    client = TestClient(app)
    
    # register one user
    user1_email = f"{uuid.uuid4().hex}@example.com"
    r1 = client.post("/users/register", json={"email": user1_email, "password": "pass123"})
    user1_id = r1.json()["id"]
    
    # login
    token_resp = client.post("/users/token", data={"username": user1_email, "password": "pass123"})
    token = token_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    # create a group for user1
    group_resp = client.post(
        "/groups/",
        json={"name": "payments4", "description": "payments", "member_ids": [user1_id]},
        headers=headers
    )
    group_id = group_resp.json()["id"]

    # try to mark payment with non-existent user (id 9999)
    payment_resp = client.post(
        "/settlements/mark-paid",
        json={
            "from_user": user1_id,
            "to_user": 9999,
            "amount": 50.0,
            "group_id": group_id
        },
        headers=headers
    )
    assert payment_resp.status_code == 404
    assert "User not found" in payment_resp.json()["detail"]
