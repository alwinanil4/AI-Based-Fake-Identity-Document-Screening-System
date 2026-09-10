"""DocShield AI — Layer 1: Behavioral & Device Signals Engine.

Inspects client telemetry, automation indicators, virtual camera signatures,
timing consistency, and camera-sensor capture heuristics.
"""

import math
import time
from typing import Dict, Any, List, Optional
import numpy as np
from PIL import Image, ExifTags

# Known automated/headless user-agent signatures
AUTOMATION_SIGNATURES = [
    "puppeteer",
    "selenium",
    "playwright",
    "headlesschrome",
    "phantomjs",
    "python-requests",
    "curl/",
    "postmanruntime",
]

# Known virtual camera / software webcam driver keywords
VIRTUAL_CAM_SIGNATURES = [
    "obs-camera",
    "virtual-camera",
    "manycam",
    "droidcam",
    "vysor",
    "fake-webcam",
]

# Known graphic editing software keywords in EXIF
PHOTO_EDITING_SIGNATURES = [
    "photoshop",
    "gimp",
    "paint.net",
    "canva",
    "lightroom",
    "snapseed",
    "picsart",
    "adobe",
    "coreldraw",
]


def extract_exif_metadata(image: Image.Image) -> Dict[str, Any]:
    """Extracts human-readable EXIF tags from a PIL image."""
    exif_data = {}
    try:
        raw_exif = image.getexif()
        if raw_exif:
            for tag_id, val in raw_exif.items():
                tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                if isinstance(val, (str, int, float)):
                    exif_data[tag_name] = str(val)
    except Exception:
        pass
    return exif_data


def calculate_image_entropy(image: Image.Image) -> float:
    """Calculates Shannon entropy of the image pixel distribution.

    Real physical camera captures have natural sensor noise (entropy typically 6.0 - 7.8).
    Synthetic/blank images or flat screenshots often have abnormally low entropy (< 5.0).
    """
    gray = image.convert("L")
    histogram = gray.histogram()
    total_pixels = sum(histogram)

    entropy = 0.0
    for count in histogram:
        if count > 0:
            p = count / total_pixels
            entropy -= p * math.log2(p)

    return round(entropy, 2)


def run_layer1_analysis(
    image: Image.Image,
    headers: Optional[Dict[str, str]] = None,
    form_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Runs behavioral and device signal heuristics against upload metadata."""
    headers = headers or {}
    form_data = form_data or {}

    flags: List[str] = []
    is_emulator = False
    is_virtual_cam = False
    is_injection_attack = False
    is_editing_software_detected = False
    has_camera_exif = False

    user_agent = headers.get("User-Agent", "").lower()
    client_device = headers.get("X-Client-Device", "").lower()
    capture_time_str = form_data.get("capture_timestamp") or headers.get("X-Capture-Timestamp")
    capture_duration_ms = form_data.get("capture_duration_ms") or headers.get("X-Capture-Duration-Ms")

    # 1. Automation & Bot Detection
    for auto_sig in AUTOMATION_SIGNATURES:
        if auto_sig in user_agent:
            flags.append(f"Automated client signature detected in User-Agent: '{auto_sig}'")
            is_emulator = True
            break

    # 2. Virtual Camera & Video Stream Injection Detection
    for vcam_sig in VIRTUAL_CAM_SIGNATURES:
        if vcam_sig in user_agent or vcam_sig in client_device:
            flags.append(f"Virtual camera/software feed driver detected: '{vcam_sig}'")
            is_virtual_cam = True
            break

    # 3. Timing & Replay Attack Heuristics
    timestamp_skew = 0.0
    now = time.time()
    if capture_time_str:
        try:
            client_ts = float(capture_time_str)
            if client_ts > 1e11:
                client_ts = client_ts / 1000.0
            timestamp_skew = abs(now - client_ts)
            if timestamp_skew > 300.0:  # > 5 minutes difference
                flags.append(f"Replay attack risk: Client timestamp skewed by {timestamp_skew:.1f}s")
                is_injection_attack = True
        except (ValueError, TypeError):
            flags.append("Malformed client capture timestamp header")

    # Capture duration heuristic: human camera capture usually takes > 400ms
    if capture_duration_ms is not None:
        try:
            dur = float(capture_duration_ms)
            if dur < 250.0:
                flags.append(f"Instantaneous capture ({dur:.0f}ms) suggests programmatic injection")
                is_injection_attack = True
        except (ValueError, TypeError):
            pass

    # 4. EXIF & Metadata Forensics (Camera vs Screenshot vs Re-encoded)
    exif_tags = extract_exif_metadata(image)
    make = exif_tags.get("Make", "").lower()
    model = exif_tags.get("Model", "").lower()
    software = exif_tags.get("Software", "").lower()

    if make or model:
        has_camera_exif = True

    # Check for photo editing software metadata
    for editor_sig in PHOTO_EDITING_SIGNATURES:
        if editor_sig in software:
            flags.append(f"Graphic editing software watermark found in EXIF: '{exif_tags.get('Software')}'")
            is_editing_software_detected = True
            break

    # Check for screenshot indicators: missing camera EXIF + exact common display dimensions
    orig_w, orig_h = image.size
    is_common_screen_res = (orig_w, orig_h) in [
        (1920, 1080), (1080, 1920), (1366, 768), (1440, 900), (2560, 1440), (1170, 2532), (1284, 2778)
    ]
    if not has_camera_exif and is_common_screen_res:
        flags.append(f"Image geometry ({orig_w}x{orig_h}) and absent EXIF indicate a digital screenshot rather than physical document capture")

    # 5. Camera Sensor Physical Noise vs Synthetic Flatness
    entropy = calculate_image_entropy(image)
    if entropy < 4.5:
        flags.append(f"Abnormally low visual entropy ({entropy}); potential blank or rendered graphic")

    # Calculate overall integrity score (100 = flawless live capture)
    penalty = 0.0
    if is_emulator:
        penalty += 45.0
    if is_virtual_cam:
        penalty += 50.0
    if is_injection_attack:
        penalty += 40.0
    if is_editing_software_detected:
        penalty += 40.0
    if entropy < 4.5:
        penalty += 20.0

    integrity_score = max(0.0, 100.0 - penalty)

    if flags:
        status = "flagged" if integrity_score < 60.0 else "suspicious"
        confidence = round(100.0 - integrity_score, 1)
    else:
        status = "passed"
        confidence = 94.0

    return {
        "status": status,
        "confidence": confidence,
        "details": {
            "is_emulator": is_emulator,
            "is_virtual_camera": is_virtual_cam,
            "is_injection_attack": is_injection_attack,
            "is_editing_software_detected": is_editing_software_detected,
            "has_camera_exif": has_camera_exif,
            "timestamp_skew_seconds": round(timestamp_skew, 2),
            "client_entropy_score": round(integrity_score, 1),
            "exif_metadata": exif_tags if exif_tags else None,
            "flags": flags,
        },
    }
