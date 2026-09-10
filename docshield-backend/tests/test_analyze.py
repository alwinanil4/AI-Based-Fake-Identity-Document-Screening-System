"""DocShield AI — Analyze Endpoint Integration Tests."""

import io
import pytest
from PIL import Image
from app import create_app


@pytest.fixture
def client():
    app = create_app("testing")
    with app.test_client() as client:
        yield client


def make_dummy_image(fmt="JPEG") -> io.BytesIO:
    buf = io.BytesIO()
    img = Image.new("RGB", (300, 200), color=(50, 100, 150))
    img.save(buf, format=fmt)
    buf.seek(0)
    return buf


def test_analyze_valid_image(client):
    """Verifies that uploading a valid image returns 200 and standard verdict response."""
    img_buf = make_dummy_image("JPEG")
    data = {
        "image": (img_buf, "passport_scan.jpg", "image/jpeg")
    }

    response = client.post(
        "/api/v1/analyze",
        data=data,
        content_type="multipart/form-data",
    )

    assert response.status_code == 200
    res = response.get_json()
    assert "verdict" in res
    assert res["verdict"] in ["Genuine", "Fake", "Suspicious", "genuine", "fake", "suspicious"]
    assert "confidence" in res
    assert "layer_results" in res
    assert "layer1_behavioral" in res["layer_results"]
    assert "layer2_ocr" in res["layer_results"]
    assert "layer3_forensics" in res["layer_results"]
    assert "layer4_ai_detection" in res["layer_results"]
    assert "reason_tags" in res
    assert isinstance(res["reason_tags"], list)


def test_analyze_rejects_non_multipart(client):
    """Verifies that non-multipart request is rejected with 415."""
    response = client.post(
        "/api/v1/analyze",
        json={"image": "base64encoded..."},
    )
    assert response.status_code == 415


def test_analyze_rejects_missing_file(client):
    """Verifies that empty form-data returns 400."""
    response = client.post(
        "/api/v1/analyze",
        data={},
        content_type="multipart/form-data",
    )
    assert response.status_code == 400
    assert "Missing document image file" in response.get_json()["message"]


def test_analyze_rejects_fake_extension(client):
    """Verifies uploading an EXE disguised as a JPG is rejected with 400."""
    fake_exe = io.BytesIO(b"MZ\x90\x00\x03\x00\x00\x00malicious binary content")
    data = {
        "image": (fake_exe, "identity.jpg", "image/jpeg")
    }

    response = client.post(
        "/api/v1/analyze",
        data=data,
        content_type="multipart/form-data",
    )

    assert response.status_code == 400
    assert "Potentially malicious file detected" in response.get_json()["message"]
