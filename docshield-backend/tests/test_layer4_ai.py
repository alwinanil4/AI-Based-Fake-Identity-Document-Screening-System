"""DocShield AI — Layer 4 Deep Learning Unit Tests."""

from PIL import Image
from app.ml.model_loader import get_ai_detector, build_efficientnet_detector
from app.layers.layer4_ai_detection import run_layer4_analysis


def test_model_loader_initialization():
    """Verifies that EfficientNet backbone initializes in eval mode."""
    model = get_ai_detector()
    assert model is not None
    assert not model.training


def test_layer4_inference_execution():
    """Verifies full Layer 4 forward pass, probability calculation, and CAM heatmap."""
    img = Image.new("RGB", (320, 240), color=(100, 150, 200))
    res = run_layer4_analysis(img)

    assert "status" in res
    assert res["status"] in ["passed", "flagged", "inconclusive"]
    assert "forgery_probability" in res
    assert "genuine_probability" in res
    assert abs((res["forgery_probability"] + res["genuine_probability"]) - 100.0) < 1.0
    assert res["heatmap_generated"] is True
    assert "heatmap_mask" in res
    assert res["heatmap_mask"].shape == (240, 320)
