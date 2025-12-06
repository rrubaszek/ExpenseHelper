import uuid
from fastapi.testclient import TestClient
from app.main import app


def test_create_equal_split_expense():
    """Test creating an expense with equal splits among all group members"""
    client = TestClient(app)
    
    # register two users
    user1_email = f"{uuid.uuid4().hex}@example.com"
    user2_email = f"{uuid.uuid4().hex}@example.com"
    
    r1 = client.post("/users/register", json={"email": user1_email, "password": "pass123", "name": "User1"})
    assert r1.status_code == 200
    user1_id = r1.json()["id"]
    
    r2 = client.post("/users/register", json={"email": user2_email, "password": "pass123", "name": "User2"})
    assert r2.status_code == 200
    user2_id = r2.json()["id"]
    
    # login user1
    token_resp = client.post("/users/token", data={"username": user1_email, "password": "pass123"})
    token = token_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # create group with both users
    group_resp = client.post(
        "/groups/",
        json={"name": "dinner", "description": "shared dinner", "member_ids": [user1_id, user2_id]},
        headers=headers
    )
    assert group_resp.status_code == 200
    group_id = group_resp.json()["id"]
    
    # create expense with equal split
    expense_resp = client.post(
        "/expenses/equal-split",
        json={
            "group_id": group_id,
            "payer_id": user1_id,
            "amount": 100.0,
            "description": "dinner split equally"
        },
        headers=headers
    )
    assert expense_resp.status_code == 200
    exp = expense_resp.json()
    assert exp["amount"] == 100.0
    assert exp["payer_id"] == user1_id
    # both members should have equal splits (50 each)
    assert exp["splits"][str(user1_id)] == 50.0
    assert exp["splits"][str(user2_id)] == 50.0


def test_create_equal_split_with_rounding():
    """Test equal split with rounding adjustment"""
    client = TestClient(app)
    
    # register three users
    emails = [f"{uuid.uuid4().hex}@example.com" for _ in range(3)]
    users = []
    for email in emails:
        r = client.post("/users/register", json={"email": email, "password": "pass123"})
        assert r.status_code == 200
        users.append(r.json()["id"])
    
    # login
    token_resp = client.post("/users/token", data={"username": emails[0], "password": "pass123"})
    token = token_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # create group
    group_resp = client.post(
        "/groups/",
        json={"name": "test", "description": "test", "member_ids": users},
        headers=headers
    )
    group_id = group_resp.json()["id"]
    
    # create expense with amount not evenly divisible by 3 (100/3 = 33.33...)
    expense_resp = client.post(
        "/expenses/equal-split",
        json={
            "group_id": group_id,
            "payer_id": users[0],
            "amount": 100.0,
            "description": "uneven split"
        },
        headers=headers
    )
    assert expense_resp.status_code == 200
    exp = expense_resp.json()
    
    # verify total splits match amount (within rounding tolerance)
    splits_total = sum(float(v) for v in exp["splits"].values())
    assert abs(splits_total - 100.0) < 0.01
    
    # first two should have 33.33, last one has 33.34
    assert abs(float(exp["splits"][str(users[0])]) - 33.33) < 0.01
    assert abs(float(exp["splits"][str(users[1])]) - 33.33) < 0.01
    assert abs(float(exp["splits"][str(users[2])]) - 33.34) < 0.01


def test_equal_split_payer_not_in_group():
    """Test that equal split fails if payer is not in group"""
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
    
    # create group with only user2
    group_resp = client.post(
        "/groups/",
        json={"name": "test", "description": "test", "member_ids": [user2_id]},
        headers=headers
    )
    group_id = group_resp.json()["id"]
    
    # register a third user not in group
    user3_email = f"{uuid.uuid4().hex}@example.com"
    r3 = client.post("/users/register", json={"email": user3_email, "password": "pass123"})
    user3_id = r3.json()["id"]

    # try to create expense with user3 (not in group) as payer
    expense_resp = client.post(
        "/expenses/equal-split",
        json={
            "group_id": group_id,
            "payer_id": user3_id,
            "amount": 100.0,
            "description": "should fail"
        },
        headers=headers
    )
    assert expense_resp.status_code == 400
    assert "Payer not in group" in expense_resp.json()["detail"]
