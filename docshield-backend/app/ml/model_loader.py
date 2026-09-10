"""DocShield AI — Deep Learning Model Loader.

Safely loads EfficientNet-B0 model checkpoints using weights_only=True with SHA256
integrity verification and fallback to initialized backbone.
"""

import os
import hashlib
import logging
from typing import Optional
import torch
import torch.nn as nn
from torchvision import models

logger = logging.getLogger(__name__)

# Global singleton model cache
_MODEL_INSTANCE: Optional[nn.Module] = None


def compute_file_sha256(filepath: str) -> str:
    """Computes SHA-256 hash of a weights checkpoint file."""
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def build_efficientnet_detector() -> nn.Module:
    """Builds EfficientNet-B0 architecture with a 2-class document forgery classification head."""
    # EfficientNet-B0 backbone
    model = models.efficientnet_b0(weights=None)

    # Replace classifier head for binary classification (Class 0: Genuine, Class 1: Forged)
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.2, inplace=True),
        nn.Linear(in_features, 2),
    )

    model.eval()
    return model


def get_ai_detector(
    weights_path: Optional[str] = None,
    expected_sha256: Optional[str] = None,
) -> nn.Module:
    """Returns the cached EfficientNet detector model.

    Enforces safe loading:
    - Uses weights_only=True to prevent arbitrary code execution vulnerabilities in PyTorch.
    - Validates file hash when expected_sha256 is supplied.
    - Falls back gracefully to initialized model if weights file does not yet exist.
    """
    global _MODEL_INSTANCE
    if _MODEL_INSTANCE is not None:
        return _MODEL_INSTANCE

    model = build_efficientnet_detector()

    # Search for weights file: specified path -> docshield_best_model.pth -> fallback
    target_weights_path = weights_path
    if not target_weights_path or not os.path.exists(target_weights_path):
        cur_dir = os.path.dirname(os.path.abspath(__file__))
        candidate_pths = [
            os.path.join(cur_dir, "weights", "docshield_best_model.pth"),
            os.path.join(cur_dir, "weights", "efficientnet_b0_docshield.pth"),
        ]
        for cand in candidate_pths:
            if os.path.exists(cand):
                target_weights_path = cand
                break

    if target_weights_path and os.path.exists(target_weights_path):
        if expected_sha256:
            actual_hash = compute_file_sha256(target_weights_path)
            if actual_hash.lower() != expected_sha256.lower():
                raise SecurityError(
                    f"Model integrity verification failed for {target_weights_path}! Hash mismatch."
                )

        logger.info("Loading EfficientNet weights from %s (weights_only=True)", target_weights_path)
        try:
            # STRICT: weights_only=True guards against pickle RCE exploits
            checkpoint = torch.load(target_weights_path, map_location="cpu", weights_only=True)
            if isinstance(checkpoint, dict) and "state_dict" in checkpoint:
                model.load_state_dict(checkpoint["state_dict"])
            elif isinstance(checkpoint, dict):
                model.load_state_dict(checkpoint)
            elif isinstance(checkpoint, torch.nn.Module):
                model = checkpoint
            else:
                logger.warning("Unexpected checkpoint structure, initializing default weights.")
        except Exception as e:
            logger.error("Failed loading model weights safely: %s", str(e))
    else:
        logger.info("No custom model weights found. Running with initialized backbone.")

    model.eval()
    _MODEL_INSTANCE = model
    return _MODEL_INSTANCE

