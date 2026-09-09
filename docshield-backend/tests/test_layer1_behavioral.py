"""DocShield AI — Layer 1 Behavioral & Device Signals Unit Tests."""

import time
import numpy as np
from PIL import Image
from app.layers.layer1_behavioral import run_layer1_analysis, calculate_image_entropy


def test_clean_client_behavior():
    """Verifies that standard mobile/desktop browser passes behavioral check."""
    # Create realistic textured image
    img = Image.fromarray(np.random.randint(50, 200, (200, 200, 3), dtype=np.uint8))
    headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15",
    }
    form_data = {
        "capture_timestamp": str(time.time()),
        "capture_duration_ms": "1850",
    }
    res = run_layer1_analysis(img, headers, form_data)

    assert res["status"] == "passed"
    assert not res["details"]["is_emulator"]
    assert not res["details"]["is_virtual_camera"]
    assert not res["details"]["is_injection_attack"]


def test_headless_bot_flagged():
    """Verifies that automated scrapers/bots (Puppeteer) are flagged."""
    img = Image.new("RGB", (200, 200), color=(100, 100, 100))
    headers = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/122.0.0.0"}
    res = run_layer1_analysis(img, headers)

    assert res["details"]["is_emulator"] is True
    assert any("HeadlessChrome" in f or "headless" in f.lower() for f in res["details"]["flags"])


def test_virtual_camera_flagged():
    """Verifies that virtual cameras (OBS-Camera) are flagged."""
    img = Image.new("RGB", (200, 200), color=(100, 100, 100))
    headers = {"X-Client-Device": "OBS-Camera Virtual Webcam Driver"}
    res = run_layer1_analysis(img, headers)

    assert res["details"]["is_virtual_camera"] is True


def test_replay_attack_skew_flagged():
    """Verifies that skewed or stale capture timestamps are flagged as replay attacks."""
    img = Image.new("RGB", (200, 200), color=(100, 100, 100))
    # Timestamp from 1 hour ago
    headers = {"X-Capture-Timestamp": str(time.time() - 3600)}
    res = run_layer1_analysis(img, headers)

    assert res["details"]["is_injection_attack"] is True
    assert any("Replay attack" in f for f in res["details"]["flags"])
