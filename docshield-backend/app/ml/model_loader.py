"""DocShield AI — Deep Learning Model Loader (Layer 4).

Safely loads the trained 3-class EfficientNet-B0 model checkpoint at Flask server
startup as a singleton instance.
"""

import os
import logging
from typing import Optional, Tuple
import torch
import torch.nn as nn
import timm

logger = logging.getLogger(__name__)

# Device selection: GPU acceleration if available, else CPU
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# PyTorch ImageFolder alphabetical order for the trained dataset
CLASSES = ["ai_generated", "genuine", "tampered"]

# Global singleton model cache
_MODEL_INSTANCE: Optional[nn.Module] = None


def build_efficientnet_detector() -> nn.Module:
    """Builds the 3-class timm EfficientNet-B0 architecture in eval mode."""
    model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=3)
    model.eval()
    return model


def get_model_path() -> str:
    """Resolves the candidate path for docshield_best_model.pth.
    
    # MODEL FILE GOES HERE: backend/models/docshield_best_model.pth
    """
    cur_dir = os.path.dirname(os.path.abspath(__file__))
    backend_root = os.path.abspath(os.path.join(cur_dir, "..", ".."))

    candidate_paths = [
        os.path.join(backend_root, "models", "docshield_best_model.pth"),
        os.path.join(cur_dir, "weights", "docshield_best_model.pth"),
        os.path.join(backend_root, "..", "docshield_best_model.pth"),
    ]

    for p in candidate_paths:
        if os.path.exists(p):
            return p

    return candidate_paths[0]


def get_ai_detector(weights_path: Optional[str] = None) -> nn.Module:
    """Returns the cached 3-class EfficientNet detector loaded at server startup."""
    global _MODEL_INSTANCE
    if _MODEL_INSTANCE is not None:
        return _MODEL_INSTANCE

    logger.info("Initializing EfficientNet-B0 detector on device: %s", DEVICE)
    model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=3)

    target_path = weights_path or get_model_path()

    if os.path.exists(target_path):
        logger.info("Loading real trained model weights from: %s", target_path)
        try:
            # Load weights safely to designated device
            state_dict = torch.load(target_path, map_location=DEVICE)
            if isinstance(state_dict, dict) and "state_dict" in state_dict:
                state_dict = state_dict["state_dict"]
            model.load_state_dict(state_dict)
            logger.info("Real docshield_best_model.pth weights loaded successfully.")
        except Exception as e:
            logger.error("Failed loading model state_dict from %s: %s", target_path, str(e))
    else:
        logger.warning(
            "Model checkpoint not found at %s. Please place docshield_best_model.pth in backend/models/",
            target_path
        )

    model.to(DEVICE)
    model.eval()
    _MODEL_INSTANCE = model
    return _MODEL_INSTANCE
