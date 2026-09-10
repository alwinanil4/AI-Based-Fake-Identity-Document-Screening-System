"""DocShield AI — Result Aggregator & Forensic Fusion Engine.

Runs all four detection layers concurrently using ThreadPoolExecutor, enforces deterministic
forensic veto rules, compiles human-readable reason tags, and renders explainable heatmap overlays.
"""

import base64
import concurrent.futures
import io
import logging
import time
from typing import Dict, Any, List, Optional, Tuple
import cv2
import numpy as np
from PIL import Image

from app.layers.layer1_behavioral import run_layer1_analysis
from app.layers.layer2_ocr import run_layer2_analysis
from app.layers.layer3_forensics import run_layer3_analysis
from app.layers.layer4_ai_detection import run_layer4_analysis
from app.schemas.analyze_schema import (
    AnalyzeResponse,
    LayerResultsBundle,
    Layer1BehavioralResult,
    Layer2OCRResult,
    Layer3ForensicsResult,
    Layer4AIResult,
    ExtractedDocumentFields,
    BehavioralSignalDetails,
)

logger = logging.getLogger(__name__)


def generate_heatmap_overlay(
    original_img: Image.Image,
    cam_mask: Optional[np.ndarray] = None,
    ela_mask: Optional[np.ndarray] = None,
) -> Optional[str]:
    """Combines CAM and ELA anomaly masks into an overlaid, explainable base64 PNG heatmap.

    Returns:
        Base64-encoded PNG data URL string ('data:image/png;base64,...') or None.
    """
    orig_np = np.array(original_img.convert("RGB"))
    h, w, _ = orig_np.shape

    # Composite anomaly map
    anomaly_map = np.zeros((h, w), dtype=np.float32)

    if cam_mask is not None:
        if cam_mask.shape != (h, w):
            cam_mask = cv2.resize(cam_mask, (w, h))
        anomaly_map += cam_mask.astype(np.float32) * 0.6

    if ela_mask is not None:
        if ela_mask.shape != (h, w):
            ela_mask = cv2.resize(ela_mask, (w, h))
        anomaly_map += ela_mask.astype(np.float32) * 0.4

    # Normalize to 0-255 uint8
    max_val = np.max(anomaly_map)
    if max_val > 10.0:
        norm_map = np.clip((anomaly_map / max_val) * 255.0, 0, 255).astype(np.uint8)
    else:
        norm_map = np.zeros((h, w), dtype=np.uint8)

    # Apply JET colormap (blue = low anomaly, red = high anomaly)
    heatmap_colored = cv2.applyColorMap(norm_map, cv2.COLORMAP_JET)
    heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

    # Blend original image with heatmap where anomaly is pronounced
    alpha = 0.45
    mask_weight = (norm_map / 255.0)[:, :, np.newaxis]
    blended = (orig_np * (1.0 - (mask_weight * alpha)) + heatmap_colored * (mask_weight * alpha)).astype(np.uint8)

    # Encode to base64 PNG
    pil_overlay = Image.fromarray(blended)
    buf = io.BytesIO()
    pil_overlay.save(buf, format="PNG", optimize=True)
    b64_str = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64_str}"


def execute_parallel_analysis(
    image: Image.Image,
    headers: Optional[Dict[str, str]] = None,
    form_data: Optional[Dict[str, Any]] = None,
    tesseract_cmd: str = "",
    model_weights_path: str = "",
    timeout_seconds: float = 8.5,
) -> Dict[str, Any]:
    """Executes Layer 1, 2, 3, and 4 in parallel within the strict ~10s SLA."""
    start_time = time.perf_counter()

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        future_l1 = executor.submit(run_layer1_analysis, image, headers, form_data)
        future_l2 = executor.submit(run_layer2_analysis, image, tesseract_cmd)
        future_l3 = executor.submit(run_layer3_analysis, image)
        future_l4 = executor.submit(run_layer4_analysis, image, model_weights_path)

        # Collect results with timeout safety
        try:
            res_l1 = future_l1.result(timeout=timeout_seconds)
        except Exception as e:
            logger.error("Layer 1 execution failed: %s", str(e))
            res_l1 = {
                "status": "inconclusive",
                "confidence": 50.0,
                "details": {"is_emulator": False, "is_virtual_camera": False, "is_injection_attack": False, "timestamp_skew_seconds": 0.0, "client_entropy_score": 50.0, "flags": ["Layer 1 timeout"]},
            }

        try:
            res_l2 = future_l2.result(timeout=timeout_seconds)
        except Exception as e:
            logger.error("Layer 2 execution failed: %s", str(e))
            res_l2 = {
                "status": "inconclusive",
                "confidence": 50.0,
                "document_type": "unknown",
                "fields": {"document_type": "unknown"},
                "mrz_detected": False,
                "mrz_checksum_valid": None,
                "mrz_format": None,
                "barcode_detected": False,
                "cross_check_matches": True,
                "anomalies": ["Layer 2 processing error"],
            }

        try:
            res_l3 = future_l3.result(timeout=timeout_seconds)
        except Exception as e:
            logger.error("Layer 3 execution failed: %s", str(e))
            res_l3 = {
                "status": "inconclusive",
                "confidence": 50.0,
                "ela_anomaly_score": 0.0,
                "copy_move_detected": False,
                "copy_move_matches_count": 0,
                "frequency_anomaly_score": 0.0,
                "photo_splicing_detected": False,
                "anomalies": ["Layer 3 processing error"],
                "ela_mask": None,
            }

        try:
            res_l4 = future_l4.result(timeout=timeout_seconds)
        except Exception as e:
            logger.error("Layer 4 execution failed: %s", str(e))
            res_l4 = {
                "status": "inconclusive",
                "confidence": 50.0,
                "model": "EfficientNet-B0",
                "forgery_probability": 50.0,
                "genuine_probability": 50.0,
                "heatmap_generated": False,
                "heatmap_mask": None,
            }

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    # -------------------------------------------------------------------------
    # AGGREGATION & DETERMINISTIC VETO ENGINE
    # -------------------------------------------------------------------------
    reason_tags: List[str] = []
    deterministic_fake = False

    # 1. Deterministic Veto Check: Layer 2 MRZ Checksum or Cross-Field Failure
    # ICAO checksum failure is cryptographic proof of tampering; AI confidence
    # must NEVER override this hard mathematical proof.
    if res_l2.get("mrz_detected") and res_l2.get("mrz_checksum_valid") is False:
        deterministic_fake = True
        reason_tags.append("Deterministic Failure: ICAO MRZ checksum mismatch (tampered identity fields)")

    if res_l2.get("cross_check_matches") is False:
        deterministic_fake = True
        reason_tags.append("Deterministic Failure: Visual document details do not match MRZ data")

    # 2. Add Layer-specific reason tags
    for anomaly in res_l2.get("anomalies", []):
        if anomaly not in reason_tags:
            reason_tags.append(f"Structural: {anomaly}")

    for anomaly in res_l3.get("anomalies", []):
        reason_tags.append(f"Forensic: {anomaly}")

    for flag in res_l1.get("details", {}).get("flags", []):
        reason_tags.append(f"Behavioral: {flag}")

    if res_l4.get("forgery_probability", 0.0) >= 65.0:
        reason_tags.append(f"AI Detection: Neural network flagged forgery ({res_l4['forgery_probability']}%)")

    # 3. Weighted Scoring Calculation
    # Weights: Layer 2: 35%, Layer 3: 30%, Layer 4: 25%, Layer 1: 10%
    l2_forgery_risk = 100.0 if res_l2.get("status") == "flagged" else (0.0 if res_l2.get("status") == "passed" else 40.0)
    l3_forgery_risk = 100.0 if res_l3.get("status") == "flagged" else (0.0 if res_l3.get("status") == "passed" else 40.0)
    l4_forgery_risk = float(res_l4.get("forgery_probability", 50.0))
    l1_forgery_risk = 100.0 if res_l1.get("status") == "flagged" else (0.0 if res_l1.get("status") == "passed" else 30.0)

    composite_forgery_score = (
        (l2_forgery_risk * 0.35)
        + (l3_forgery_risk * 0.30)
        + (l4_forgery_risk * 0.25)
        + (l1_forgery_risk * 0.10)
    )

    # 4. Final Verdict Determination
    if deterministic_fake or composite_forgery_score >= 58.0:
        verdict = "Fake"
        overall_confidence = max(88.0, composite_forgery_score)
    elif composite_forgery_score >= 32.0 or len(reason_tags) > 0:
        verdict = "Suspicious"
        overall_confidence = round(max(composite_forgery_score, 100.0 - composite_forgery_score), 1)
    else:
        verdict = "Genuine"
        overall_confidence = round(100.0 - composite_forgery_score, 1)
        if not reason_tags:
            reason_tags.append("All structural, forensic, and biometric security checks passed")

    # 5. Generate Heatmap Overlay
    cam_mask = res_l4.get("heatmap_mask")
    ela_mask = res_l3.get("ela_mask")
    heatmap_data_url = generate_heatmap_overlay(image, cam_mask=cam_mask, ela_mask=ela_mask)

    # 6. Bundle results into standard schema + raw dicts
    bundle = LayerResultsBundle(
        layer1_behavioral=Layer1BehavioralResult(
            status=res_l1["status"],
            confidence=res_l1["confidence"],
            details=BehavioralSignalDetails(**res_l1.get("details", {})),
        ),
        layer2_ocr=Layer2OCRResult(
            status=res_l2["status"],
            confidence=res_l2["confidence"],
            document_type=res_l2["document_type"],
            fields=ExtractedDocumentFields(**res_l2.get("fields", {})),
            mrz_detected=res_l2["mrz_detected"],
            mrz_checksum_valid=res_l2["mrz_checksum_valid"],
            mrz_format=res_l2["mrz_format"],
            barcode_detected=res_l2["barcode_detected"],
            cross_check_matches=res_l2["cross_check_matches"],
            anomalies=res_l2["anomalies"],
        ),
        layer3_forensics=Layer3ForensicsResult(
            status=res_l3["status"],
            confidence=res_l3["confidence"],
            ela_anomaly_score=res_l3["ela_anomaly_score"],
            copy_move_detected=res_l3["copy_move_detected"],
            copy_move_matches_count=res_l3["copy_move_matches_count"],
            frequency_anomaly_score=res_l3["frequency_anomaly_score"],
            photo_splicing_detected=res_l3["photo_splicing_detected"],
            anomalies=res_l3["anomalies"],
        ),
        layer4_ai_detection=Layer4AIResult(
            status=res_l4["status"],
            confidence=res_l4["confidence"],
            model=res_l4["model"],
            forgery_probability=res_l4["forgery_probability"],
            genuine_probability=res_l4["genuine_probability"],
            heatmap_generated=res_l4["heatmap_generated"],
        ),
    )

    clean_layer_results = {
        "layer1": {
            "name": "Behavioral & Device Signals",
            "status": res_l1["status"],
            "confidence": res_l1["confidence"],
            "details": res_l1.get("details", {}),
        },
        "layer2": {
            "name": "OCR & Structural Validation",
            "status": res_l2["status"],
            "confidence": res_l2["confidence"],
            "document_type": res_l2["document_type"],
            "fields": res_l2.get("fields", {}),
            "mrz_detected": res_l2["mrz_detected"],
            "mrz_checksum_valid": res_l2["mrz_checksum_valid"],
            "barcode_detected": res_l2["barcode_detected"],
            "cross_check_matches": res_l2["cross_check_matches"],
            "anomalies": res_l2["anomalies"],
        },
        "layer3": {
            "name": "Image Forensics",
            "status": res_l3["status"],
            "confidence": res_l3["confidence"],
            "ela_anomaly_score": res_l3["ela_anomaly_score"],
            "copy_move_detected": res_l3["copy_move_detected"],
            "copy_move_matches_count": res_l3["copy_move_matches_count"],
            "frequency_anomaly_score": res_l3["frequency_anomaly_score"],
            "photo_splicing_detected": res_l3["photo_splicing_detected"],
            "anomalies": res_l3["anomalies"],
        },
        "layer4": {
            "name": "AI / Deep Learning Detection",
            "status": res_l4["status"],
            "confidence": res_l4["confidence"],
            "model": res_l4["model"],
            "forgery_probability": res_l4["forgery_probability"],
            "genuine_probability": res_l4["genuine_probability"],
            "verdict": res_l4.get("verdict", "fake" if res_l4["forgery_probability"] >= 60 else "genuine"),
        },
        # Backward compatibility aliases
        "layer1_behavioral": bundle.layer1_behavioral.model_dump(),
        "layer2_ocr": bundle.layer2_ocr.model_dump(),
        "layer3_forensics": bundle.layer3_forensics.model_dump(),
        "layer4_ai_detection": bundle.layer4_ai_detection.model_dump(),
    }

    elapsed = round(elapsed_ms, 2)

    return {
        "verdict": verdict,
        "confidence": round(overall_confidence, 1),
        "reason_tags": reason_tags,
        "heatmap": heatmap_data_url,
        "heatmap_base64": heatmap_data_url,
        "layer_results": clean_layer_results,
        "analysis_time_ms": elapsed,
        "processing_time_ms": elapsed,
    }
