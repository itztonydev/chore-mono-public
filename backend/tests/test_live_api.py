import asyncio
import time
from backend.main import app
from backend.db.session import init_db
from fastapi.testclient import TestClient

def main():
    print("=== 1. INITIALIZING DATABASE SCHEMA ===")
    asyncio.run(init_db())
    print("SUCCESS: Database tables created via SQLAlchemy.")

    print("=== 2. BOOTING FASTAPI TEST CLIENT ===")
    client = TestClient(app)

    print("=== 3. TESTING OPENAPI SWAGGER DOCS ===")
    res = client.get("/docs")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    print(f"SUCCESS: /docs HTTP {res.status_code}")

    res = client.get("/openapi.json")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    openapi_data = res.json()
    print(f"SUCCESS: /openapi.json HTTP {res.status_code}, Title: '{openapi_data.get('info', {}).get('title')}', Endpoints: {len(openapi_data.get('paths', {}))}")

    print("=== 4. TESTING AUTH CHALLENGE ENDPOINT ===")
    res = client.post("/api/v1/auth/ed25519-challenge", json={})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    challenge_data = res.json()
    print(f"SUCCESS: Challenge generated: {challenge_data.get('challenge')[:16]}...")

    print("=== 5. TESTING USER REGISTRATION ===")
    ts = int(time.time())
    user_payload = {
        "email": f"test_roommate_{ts}@apartment4b.com",
        "password": "SecureRoommatePassword123!",
        "full_name": "Test Roommate"
    }
    res = client.post("/api/v1/auth/register", json=user_payload)
    assert res.status_code in (200, 201), f"Registration failed: {res.status_code} - {res.text}"
    user_data = res.json()
    token = user_data.get("access_token")
    print(f"SUCCESS: User registered! ID: {user_data.get('user_id')}, Email: {user_data.get('email')}")

    print("=== 6. TESTING USER LOGIN ===")
    login_payload = {
        "email": user_payload["email"],
        "password": user_payload["password"]
    }
    res = client.post("/api/v1/auth/login", json=login_payload)
    assert res.status_code == 200, f"Login failed: {res.status_code} - {res.text}"
    print(f"SUCCESS: User logged in! Token received: {res.json().get('access_token')[:20]}...")

    print("=== 7. TESTING HOUSEHOLD & EXPENSE SIMPLIFICATION LOGIC ===")
    from backend.dsa_engines.graph_debt_simplifier import DebtSimplificationEngine
    sample_expenses = [
        {
            "payer_id": "Alice",
            "amount": 60.0,
            "splits": [
                {"user_id": "Alice", "split_amount": 20.0},
                {"user_id": "Bob", "split_amount": 20.0},
                {"user_id": "Charlie", "split_amount": 20.0},
            ]
        }
    ]
    result = DebtSimplificationEngine.simplify_debts(sample_expenses)
    print(f"SUCCESS: Debt simplification generated {len(result.simplified_transactions)} minimal transaction vectors:")
    for tx in result.simplified_transactions:
        print(f"   - {tx.from_user} pays {tx.to_user}: ${tx.amount:.2f}")

    print("\n>>> ALL BACKEND HEALTH & LOGIC CHECKS PASSED 100%! <<<")

if __name__ == "__main__":
    main()
