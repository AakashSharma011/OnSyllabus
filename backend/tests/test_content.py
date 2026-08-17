from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_colleges_returns_list():
    response = client.get("/colleges/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_college_requires_auth():
    response = client.post("/colleges/", json={"name": "Test College", "university": "Test Uni"})
    assert response.status_code == 401