from fastapi.testclient import TestClient
from app.main import app
import json

client = TestClient(app)

with open("test_sync.json") as f:
    payload = json.load(f)

response = client.post("/api/v1/pedidos/sync", json=payload)
print("STATUS:", response.status_code)
print("RESPONSE:", response.json())
