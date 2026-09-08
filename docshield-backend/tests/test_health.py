"""DocShield AI — Health Endpoint & Security Headers Unit Test."""

import pytest
from app import create_app


@pytest.fixture
def client():
    app = create_app("testing")
    with app.test_client() as client:
        yield client


def test_health_endpoint(client):
    """Verifies that GET /api/v1/health returns 200 and healthy payload."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "healthy"
    assert "layers" in data
    assert data["layers"]["layer1_behavioral"] == "online"


def test_security_headers_present(client):
    """Verifies that all required security headers are attached to responses."""
    response = client.get("/api/v1/health")
    headers = response.headers

    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("X-XSS-Protection") == "1; mode=block"
    assert "Content-Security-Policy" in headers
    assert "default-src 'none'" in headers.get("Content-Security-Policy")
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "camera=()" in headers.get("Permissions-Policy")
    assert "no-store" in headers.get("Cache-Control")
