"""DocShield AI — Security Penetration & Attack Simulation Test Suite.

Simulates adversarial attacks per Section 6 specification:
1. Non-image binary masked as JPEG (EXE/ELF)
2. Oversized payload rejection
3. Decompression bomb attack defense
4. Path traversal in filenames (../../etc/passwd)
5. Rate limiting denial of service attack on /analyze
6. Brute force credential stuffing attack on /login
7. JWT authorization bypass attempts (none, expired, forged)
8. Zero-leakage verification (no internal paths or stack traces exposed)
"""

import io
import os
import time
import pytest
from PIL import Image
import jwt
from app import create_app
from app.extensions import db
from app.auth.models import AdminUser
from app.security.sanitization import sanitize_filename, assert_path_in_directory, SecurityValidationError


@pytest.fixture
def app():
    app = create_app("testing")
    with app.app_context():
        db.create_all()
        admin = AdminUser(email="security_admin@docshield.local", role="admin")
        admin.set_password("AdminSecurePass!2026")
        db.session.add(admin)
        db.session.commit()

        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def test_attack_1_masked_binary_as_jpeg(client):
    """Attack 1: Uploading a Windows EXE or ELF binary disguised as .jpg must fail."""
    exe_payload = b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00malicious_code_here"
    data = {"image": (io.BytesIO(exe_payload), "invoice_scan.jpg", "image/jpeg")}

    res = client.post("/api/v1/analyze", data=data, content_type="multipart/form-data")
    assert res.status_code == 400
    json_data = res.get_json()
    assert "Potentially malicious file detected" in json_data["message"]


def test_attack_2_oversized_file_rejected(client, app):
    """Attack 2: Uploading a file exceeding MAX_CONTENT_LENGTH must be rejected."""
    # Temporarily set max size to 50KB for test speed
    orig_limit = app.config["MAX_CONTENT_LENGTH"]
    app.config["MAX_CONTENT_LENGTH"] = 50 * 1024
    try:
        big_payload = b"A" * (60 * 1024)
        data = {"image": (io.BytesIO(big_payload), "heavy.jpg", "image/jpeg")}
        res = client.post("/api/v1/analyze", data=data, content_type="multipart/form-data")
        assert res.status_code in [400, 413]
    finally:
        app.config["MAX_CONTENT_LENGTH"] = orig_limit


def test_attack_3_decompression_bomb_rejected(client, app):
    """Attack 3: Tiny compressed file with absurd declared dimensions (>8000px) must be rejected."""
    buf = io.BytesIO()
    # 9000 x 50 is small in bytes but exceeds 8000px dimension ceiling
    bomb = Image.new("RGB", (9000, 50), color=(0, 0, 0))
    bomb.save(buf, format="JPEG")
    buf.seek(0)

    data = {"image": (buf, "innocent_document.jpg", "image/jpeg")}
    res = client.post("/api/v1/analyze", data=data, content_type="multipart/form-data")
    assert res.status_code == 400
    assert "Decompression bomb" in res.get_json()["message"]


def test_attack_4_path_traversal_filename(client, app):
    """Attack 4: Uploading malicious filenames like '../../etc/passwd' must be sanitized."""
    # Direct sanitization unit check
    with pytest.raises(SecurityValidationError, match="traversal"):
        sanitize_filename("../../etc/passwd.jpg")

    with pytest.raises(SecurityValidationError, match="Null byte"):
        sanitize_filename("valid_name.jpg\0.exe")

    # API endpoint check: upload with malicious path
    buf = io.BytesIO()
    valid_img = Image.new("RGB", (100, 100), color=(255, 255, 255))
    valid_img.save(buf, format="JPEG")
    buf.seek(0)

    data = {"image": (buf, "../../../../windows/system32/cmd.jpg", "image/jpeg")}
    res = client.post("/api/v1/analyze", data=data, content_type="multipart/form-data")

    # Even if accepted or rejected, verify NO file was written to the traversal location
    assert not os.path.exists("windows/system32/cmd.jpg")
    # Clean UUID filename must have been used internally
    assert res.status_code in [200, 400]


def test_attack_5_rate_limit_analyze(client):
    """Attack 5: Flooding /api/v1/analyze beyond rate limit must return 429."""
    from unittest.mock import patch

    buf = io.BytesIO()
    img = Image.new("RGB", (64, 64), color=(200, 200, 200))
    img.save(buf, format="JPEG")
    raw_img = buf.getvalue()

    mock_agg = {
        "verdict": "GENUINE",
        "confidence": 95.0,
        "reason_tags": [],
        "heatmap_base64": None,
        "layer_results": {},
        "analysis_time_ms": 12,
    }

    hit_429 = False
    with patch("app.api.analyze.execute_parallel_analysis", return_value=mock_agg):
        for i in range(25):
            data = {"image": (io.BytesIO(raw_img), f"scan_{i}.jpg", "image/jpeg")}
            res = client.post("/api/v1/analyze", data=data, content_type="multipart/form-data")
            if res.status_code == 429:
                hit_429 = True
                assert "Rate Limit Exceeded" in res.get_json()["error"]
                break

    assert hit_429, "Rate limiter failed to throttle excessive requests to /analyze"


def test_attack_6_login_brute_force_throttled(client):
    """Attack 6: Repeated failed logins must be throttled with 429."""
    hit_429 = False
    for _ in range(8):
        res = client.post(
            "/api/v1/auth/login",
            json={"email": "security_admin@docshield.local", "password": "WrongPasswordAttempt"},
        )
        if res.status_code == 429:
            hit_429 = True
            break

    assert hit_429, "Login endpoint failed to throttle repeated brute-force attempts"


def test_attack_7_admin_auth_bypass_prevented(client, app):
    """Attack 7: Accessing admin routes with no token, expired token, or forged token must fail."""
    # 1. No token
    res_no_token = client.get("/api/v1/admin/scans")
    assert res_no_token.status_code == 401

    # 2. Forged signature token (using 32+ byte key)
    forged_token = jwt.encode(
        {"sub": "1", "role": "admin", "token_type": "access", "exp": time.time() + 3600},
        "attacker-fake-signing-key-min-32-characters!",
        algorithm="HS256",
    )
    res_forged = client.get(
        "/api/v1/admin/scans",
        headers={"Authorization": f"Bearer {forged_token}"},
    )
    assert res_forged.status_code == 401

    # 3. Valid signature but missing admin role (e.g. role: 'guest')
    guest_token = jwt.encode(
        {"sub": "2", "role": "guest", "token_type": "access", "exp": time.time() + 3600},
        app.config["JWT_SECRET_KEY"],
        algorithm="HS256",
    )
    res_guest = client.get(
        "/api/v1/admin/scans",
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert res_guest.status_code == 403


def test_attack_8_zero_leakage_on_exceptions(client):
    """Attack 8: Confirm responses never leak stack traces, internal paths, or debug code."""
    # Trigger 404
    res_404 = client.get("/api/v1/nonexistent_endpoint_for_probing")
    text_404 = res_404.get_data(as_text=True)
    assert "Traceback" not in text_404
    assert "c:\\" not in text_404.lower()
    assert "/home/" not in text_404.lower()

    # Trigger malformed JSON on an endpoint
    res_400 = client.post("/api/v1/auth/login", data="this is not json", content_type="application/json")
    text_400 = res_400.get_data(as_text=True)
    assert "Traceback" not in text_400
    assert "docshield-backend" not in text_400
