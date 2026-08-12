from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@patch("app.api.routes.auth.send_otp")
def test_signup_sends_otp(mock_send_otp):
    response = client.post("/auth/signup", json={
        "email": "testuser@example.com",
        "password": "testpassword123"
    })
    assert response.status_code == 200
    mock_send_otp.assert_called_once()