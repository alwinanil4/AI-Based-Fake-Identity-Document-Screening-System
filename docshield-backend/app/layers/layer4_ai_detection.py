"""DocShield AI — Layer 4: AI / Deep Learning Forgery Detection Engine.

Runs EfficientNet-B0 inference on document crops, produces probabilistic classification
scores (genuine vs forged), and extracts localized Class Activation Maps (CAM).
"""

import logging
from typing import Dict, Any, Tuple
import cv2
import numpy as np
from PIL import Image
import torch
import torch.nn.functional as F
from torchvision import transforms

from app.ml.model_loader import get_ai_detector

logger = logging.getLogger(__name__)

# Standard image preprocessing pipeline
_PREPROCESS = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


def generate_class_activation_map(
    feature_maps: torch.Tensor,
    linear_weights: torch.Tensor,
    target_size: Tuple[int, int],
) -> np.ndarray:
    """Generates Class Activation Map (CAM) highlighting regions contributing to forgery verdict.

    Args:
        feature_maps: Tensor of shape [1, Channels, H, W] from the final conv layer.
        linear_weights: Weights for the forged class from final linear layer [Channels].
        target_size: (width, height) to resize heatmap back to original image aspect.

    Returns:
        uint8 numpy array of shape [height, width] normalized between 0 and 255.
    """
    with torch.no_grad():
        # feature_maps shape: [1, C, H, W]
        # linear_weights shape: [C]
        bs, c, h, w = feature_maps.shape
        weights = linear_weights.view(1, c, 1, 1)

        # Weighted combination of feature maps
        cam = torch.sum(feature_maps * weights, dim=1).squeeze(0)  # [H, W]
        cam = F.relu(cam)  # keep positive contributions

        cam_np = cam.cpu().numpy()
        max_val = np.max(cam_np)
        min_val = np.min(cam_np)

        if max_val - min_val > 1e-6:
            cam_norm = (cam_np - min_val) / (max_val - min_val)
        else:
            cam_norm = np.zeros_like(cam_np)

        cam_uint8 = (cam_norm * 255.0).astype(np.uint8)

        # Resize to target image dimensions
        resized_cam = cv2.resize(cam_uint8, target_size, interpolation=cv2.INTER_CUBIC)
        return resized_cam


# ==============================================================================
# LAYER 4 — AI / DEEP LEARNING MODEL INTEGRATION
# ------------------------------------------------------------------------------
# INSTRUCTIONS FOR INTEGRATING TRAINED COLAB MODEL:
# 1. Place your trained model file `docshield_best_model.pth` in:
#    `docshield-backend/app/ml/weights/docshield_best_model.pth`
# 2. If you have custom Colab inference or Grad-CAM functions:
#    - Set MODEL_WEIGHTS_PATH in config or .env to point to `docshield_best_model.pth`
#    - Model is loaded once at server startup (singleton in app/ml/model_loader.py)
#    - You can hook custom Colab predict() / Grad-CAM in the marked blocks below.
# ==============================================================================

import io
import base64
from typing import Union


def convert_mask_to_base64_heatmap(image: Image.Image, cam_mask: np.ndarray) -> str:
    """Renders Grad-CAM mask onto original image and encodes to a base64 PNG string."""
    try:
        orig_np = np.array(image.convert("RGB"))
        h, w, _ = orig_np.shape
        if cam_mask.shape != (h, w):
            cam_mask = cv2.resize(cam_mask, (w, h))

        heatmap_colored = cv2.applyColorMap(cam_mask, cv2.COLORMAP_JET)
        heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

        alpha = 0.45
        mask_weight = (cam_mask.astype(np.float32) / 255.0)[:, :, np.newaxis]
        blended = (orig_np * (1.0 - (mask_weight * alpha)) + heatmap_colored * (mask_weight * alpha)).astype(np.uint8)

        pil_overlay = Image.fromarray(blended)
        buf = io.BytesIO()
        pil_overlay.save(buf, format="PNG")
        b64_str = base64.b64encode(buf.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{b64_str}"
    except Exception as e:
        logger.warning("Error rendering Layer 4 base64 heatmap: %s", str(e))
        return ""


def run_layer4(
    image_input: Union[Image.Image, str],
    weights_path: str = "",
) -> Dict[str, Any]:
    """Public Layer 4 entrypoint: accepts an image path or PIL Image.

    Returns:
        {
            "verdict": "genuine" | "fake" | "suspicious",
            "confidence": float (0-100),
            "heatmap_base64": "data:image/png;base64,...",
            "heatmap_mask": np.ndarray,
            "forgery_probability": float,
            "genuine_probability": float,
            "model": "EfficientNet-B0 / Custom Colab Model"
        }
    """
    if isinstance(image_input, str):
        image = Image.open(image_input).convert("RGB")
    else:
        image = image_input

    # -------------------------------------------------------------------------
    # PLACEHOLDER: CUSTOM COLAB `predict(image_path)` INTEGRATION HOOK
    # If using a custom standalone inference function from Colab:
    # Example:
    #   colab_result = predict(image_path) # -> {"verdict": "fake", "confidence": 0.95}
    # -------------------------------------------------------------------------

    orig_w, orig_h = image.size
    model = get_ai_detector(weights_path=weights_path)

    # Preprocess image
    tensor_input = _PREPROCESS(image).unsqueeze(0)

    with torch.no_grad():
        # Extract features from backbone
        features = model.features(tensor_input)
        pooled = model.avgpool(features)
        flattened = torch.flatten(pooled, 1)
        logits = model.classifier(flattened)

        probs = F.softmax(logits, dim=1).squeeze(0)
        prob_genuine = float(probs[0].item()) * 100.0
        prob_forgery = float(probs[1].item()) * 100.0

        linear_weights = model.classifier[1].weight[1]

        # ---------------------------------------------------------------------
        # PLACEHOLDER: CUSTOM GRAD-CAM GENERATION HOOK
        # If your Colab Grad-CAM function returns a heatmap numpy array or base64:
        # cam_mask = your_gradcam_fn(image)
        # ---------------------------------------------------------------------
        cam_mask = generate_class_activation_map(
            feature_maps=features,
            linear_weights=linear_weights,
            target_size=(orig_w, orig_h),
        )

    # Convert CAM mask to base64 overlay image
    heatmap_base64 = convert_mask_to_base64_heatmap(image, cam_mask)

    # Determine verdict & confidence
    if prob_forgery >= 60.0:
        verdict = "fake"
        confidence = prob_forgery
        status = "flagged"
    elif prob_forgery <= 40.0:
        verdict = "genuine"
        confidence = prob_genuine
        status = "passed"
    else:
        verdict = "suspicious"
        confidence = max(prob_forgery, prob_genuine)
        status = "inconclusive"

    return {
        "verdict": verdict,
        "status": status,
        "confidence": round(confidence, 1),
        "model": "EfficientNet-B0 (DocShield)",
        "forgery_probability": round(prob_forgery, 1),
        "genuine_probability": round(prob_genuine, 1),
        "heatmap_generated": True,
        "heatmap_mask": cam_mask,
        "heatmap_base64": heatmap_base64,
    }


def run_layer4_analysis(
    image: Image.Image,
    weights_path: str = "",
) -> Dict[str, Any]:
    """Compatibility wrapper calling run_layer4."""
    return run_layer4(image, weights_path=weights_path)

