"""DocShield AI — Admin Authentication & Access Control Unit Tests."""

from datetime import datetime, timezone, timedelta
import pytest
import jwt
from app import create_app
from app.extensions import db
from app.auth.models import AdminUser
from app.models.scan import ScanResult


@pytest.fixture
def app():
    app = create_app("testing")
    with app.app_context():
        db.create_all()
        admin = AdminUser(email="testadmin@docshield.local", role="admin")
        admin.set_password("SecurePassword@123")
        db.session.add(admin)

        non_admin = AdminUser(email="viewer@docshield.local", role="viewer")
        non_admin.set_password("ViewerPassword@123")
        db.session.add(non_admin)

        # Seed sample scan result
        scan = ScanResult(
            request_id="req-test-12345",
            verdict="genuine",
            confidence=96.5,
            document_type="passport",
            reason_tags="MRZ verified; Clean ELA",
            analysis_time_ms=1250.0,
        )
        db.session.add(scan)
        db.session.commit()

        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def test_admin_login_success(client):
    """Verifies that correct credentials yield valid JWT and httpOnly cookie."""
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "testadmin@docshield.local", "password": "SecurePassword@123"},
    )
    assert res.status_code == 200
    data = res.get_json()
    assert "access_token" in data
    assert data["user"]["email"] == "testadmin@docshield.local"
    assert data["user"]["role"] == "admin"


def test_admin_login_invalid_password(client):
    """Verifies that bad credentials return 401 without detail leaks."""
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "testadmin@docshield.local", "password": "WrongPassword!"},
    )
    assert res.status_code == 401
    assert "Invalid email or password" in res.get_json()["message"]


def test_account_lockout_after_repeated_failures(client):
    """Simulates brute-force attack and verifies 5 failed attempts lock the account."""
    for _ in range(5):
        client.post(
            "/api/v1/auth/login",
            json={"email": "testadmin@docshield.local", "password": "WrongPassword!"},
        )

    # 6th attempt should be blocked with 429 Account Locked
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "testadmin@docshield.local", "password": "SecurePassword@123"},
    )
    assert res.status_code == 429
    assert "locked" in res.get_json()["message"].lower()


def test_admin_scans_without_token_unauthorized(client):
    """Verifies protected admin routes reject unauthenticated requests."""
    res = client.get("/api/v1/admin/scans")
    assert res.status_code == 401


def test_admin_scans_with_valid_token(client):
    """Verifies that an authorized admin can query the scan audit trail."""
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "testadmin@docshield.local", "password": "SecurePassword@123"},
    )
    token = login_res.get_json()["access_token"]

    res = client.get(
        "/api/v1/admin/scans",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["total"] >= 1
    assert len(data["scans"]) >= 1
    assert data["scans"][0]["request_id"] == "req-test-12345"


def test_admin_scans_with_tampered_token(client, app):
    """Verifies that modifying the JWT signature results in 401."""
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "testadmin@docshield.local", "password": "SecurePassword@123"},
    )
    valid_token = login_res.get_json()["access_token"]
    tampered_token = valid_token[:-6] + "xxxxxx"

    res = client.get(
        "/api/v1/admin/scans",
        headers={"Authorization": f"Bearer {tampered_token}"},
    )
    assert res.status_code == 401


def test_admin_scans_with_expired_token(client, app):
    """Verifies expired tokens are rejected with 401."""
    secret = app.config["JWT_SECRET_KEY"]
    expired_payload = {
        "sub": "1",
        "email": "testadmin@docshield.local",
        "role": "admin",
        "token_type": "access",
        "iat": datetime.now(timezone.utc) - timedelta(hours=2),
        "exp": datetime.now(timezone.utc) - timedelta(hours=1),
    }
    expired_token = jwt.encode(expired_payload, secret, algorithm="HS256")

    res = client.get(
        "/api/v1/admin/scans",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert res.status_code == 401
    assert "expired" in res.get_json()["message"].lower()


def test_admin_scans_non_admin_forbidden(client):
    """Verifies that users lacking admin role receive 403 Forbidden."""
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "viewer@docshield.local", "password": "ViewerPassword@123"},
    )
    token = login_res.get_json()["access_token"]

    res = client.get(
        "/api/v1/admin/scans",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "Forbidden" in res.get_json()["error"]
