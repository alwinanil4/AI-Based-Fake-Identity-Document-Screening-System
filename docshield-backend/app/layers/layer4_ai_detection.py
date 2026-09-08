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


def run_layer4_analysis(
    image: Image.Image,
    weights_path: str = "",
) -> Dict[str, Any]:
    """Executes Layer 4 deep learning inference and heatmap generation.

    Returns:
        Dict matching Layer4AIResult schema + heatmap_mask numpy array.
    """
    orig_w, orig_h = image.size
    model = get_ai_detector(weights_path=weights_path)

    # Preprocess image
    tensor_input = _PREPROCESS(image).unsqueeze(0)  # [1, 3, 224, 224]

    with torch.no_grad():
        # Extract features from backbone
        features = model.features(tensor_input)  # [1, 1280, 7, 7]
        pooled = model.avgpool(features)  # [1, 1280, 1, 1]
        flattened = torch.flatten(pooled, 1)  # [1, 1280]
        logits = model.classifier(flattened)  # [1, 2]

        probs = F.softmax(logits, dim=1).squeeze(0)
        prob_genuine = float(probs[0].item()) * 100.0
        prob_forgery = float(probs[1].item()) * 100.0

        # Extract classifier weights for class 1 (forgery)
        linear_weights = model.classifier[1].weight[1]  # [1280]

        # Generate localization heatmap
        cam_mask = generate_class_activation_map(
            feature_maps=features,
            linear_weights=linear_weights,
            target_size=(orig_w, orig_h),
        )

    # Determine status
    if prob_forgery >= 60.0:
        status = "flagged"
        confidence = prob_forgery
    elif prob_forgery <= 40.0:
        status = "passed"
        confidence = prob_genuine
    else:
        status = "inconclusive"
        confidence = max(prob_forgery, prob_genuine)

    return {
        "status": status,
        "confidence": round(confidence, 1),
        "model": "EfficientNet-B0",
        "forgery_probability": round(prob_forgery, 1),
        "genuine_probability": round(prob_genuine, 1),
        "heatmap_generated": True,
        "heatmap_mask": cam_mask,
    }
