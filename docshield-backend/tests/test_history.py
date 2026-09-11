"""DocShield AI — History and Scan Detail Endpoint Tests."""

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
    img = Image.new("RGB", (300, 200), color=(60, 120, 180))
    img.save(buf, format=fmt)
    buf.seek(0)
    return buf


def test_history_and_scan_by_id(client):
    """Verifies that an analyzed document shows in /api/history and can be retrieved via /api/scan/<id>."""
    # 1. Upload and analyze a document
    img_buf = make_dummy_image("JPEG")
    data = {
        "image": (img_buf, "test_doc.jpg", "image/jpeg")
    }

    analyze_resp = client.post(
        "/api/v1/analyze",
        data=data,
        content_type="multipart/form-data"
    )
    assert analyze_resp.status_code == 200
    res_data = analyze_resp.get_json()
    scan_id = res_data.get("id")
    assert scan_id is not None

    # 2. Query history list
    hist_resp = client.get("/api/history")
    assert hist_resp.status_code == 200
    data = hist_resp.get_json()
    assert "scans" in data
    assert isinstance(data["scans"], list)
    assert any(item["id"] == scan_id for item in data["scans"])

    # 3. Query specific scan by ID
    scan_resp = client.get(f"/api/scan/{scan_id}")
    assert scan_resp.status_code == 200
    scan_detail = scan_resp.get_json()
    assert scan_detail["id"] == scan_id
    assert "verdict" in scan_detail
    assert "confidence" in scan_detail
    assert "reason_tags" in scan_detail
    assert "layer_results" in scan_detail


def test_stats_endpoint(client):
    """Verifies that /api/stats returns real aggregated counters."""
    resp = client.get("/api/stats")
    assert resp.status_code == 200
    stats = resp.get_json()
    assert "total" in stats
    assert "genuine" in stats
    assert "suspicious" in stats
    assert "fake" in stats
    assert "avgRisk" in stats
    assert "statusDistribution" in stats
    assert isinstance(stats["statusDistribution"], list)

