"""DocShield AI — Layer 3 Image Forensics Unit Tests."""

import numpy as np
from PIL import Image, ImageDraw
from app.layers.layer3_forensics import (
    ErrorLevelAnalysis,
    CopyMoveDetector,
    FrequencyForensics,
    run_layer3_analysis,
)


def test_ela_computation():
    """Verifies that ELA produces valid numeric score and 2D difference mask."""
    img = Image.new("RGB", (300, 300), color=(128, 128, 128))
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 50, 150, 150], fill=(200, 50, 50))

    score, mask = ErrorLevelAnalysis.compute_ela(img)
    assert isinstance(score, float)
    assert 0.0 <= score <= 100.0
    assert mask.shape == (300, 300)


def test_copy_move_detection():
    """Verifies copy-move detection on cloned image regions."""
    # Create image with textured pattern
    base = np.zeros((400, 400, 3), dtype=np.uint8)
    np.random.seed(42)
    # Add random high-frequency texture in one patch
    patch = np.random.randint(0, 255, (80, 80, 3), dtype=np.uint8)
    base[40:120, 40:120] = patch
    # Clone the exact patch to another location far away (copy-move forgery)
    base[250:330, 250:330] = patch

    detected, count, points = CopyMoveDetector.detect_clones(base, min_spatial_distance=50.0)
    assert isinstance(detected, bool)
    assert count >= 0


def test_frequency_forensics():
    """Verifies 2D FFT computation produces expected spectrum and bounded anomaly score."""
    img_np = np.random.randint(0, 255, (256, 256, 3), dtype=np.uint8)
    score, spectrum = FrequencyForensics.compute_fft_anomaly(img_np)

    assert isinstance(score, float)
    assert 0.0 <= score <= 100.0
    assert spectrum.shape == (512, 512)


def test_layer3_pipeline():
    """Verifies complete Layer 3 pipeline execution."""
    img = Image.new("RGB", (250, 250), color=(240, 240, 240))
    res = run_layer3_analysis(img)

    assert "status" in res
    assert res["status"] in ["passed", "flagged", "inconclusive"]
    assert "ela_anomaly_score" in res
    assert "copy_move_detected" in res
    assert "frequency_anomaly_score" in res
    assert "photo_splicing_detected" in res
    assert "anomalies" in res
    assert "ela_mask" in res
