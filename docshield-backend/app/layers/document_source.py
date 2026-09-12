"""DocShield AI — Document Source & Structural Integrity Verification Layer.

Analyzes structural characteristics of uploaded PDFs and image containers
(PDF AcroForms, signature dictionaries, EXIF metadata, screenshot indicators,
and editing software artifacts).

CRITICAL NOTICE:
This module performs structural and container analysis. It does NOT perform
government certificate authority verification or DigiLocker partner API validation.
No government authentication claims are made without authorized live gateway access.
"""

import io
import logging
import os
import re
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image, ExifTags

logger = logging.getLogger(__name__)

# Common screen resolutions (width, height) in portrait and landscape
COMMON_SCREEN_RESOLUTIONS = {
    # Full HD / 2K / 4K Desktop
    (1920, 1080), (1080, 1920),
    (2560, 1440), (1440, 2560),
    (3840, 2160), (2160, 3840),
    (1366, 768), (768, 1366),
    (1280, 720), (720, 1280),
    (1440, 900), (900, 1440),
    (1680, 1050), (1050, 1680),
    (1536, 864), (864, 1536),
    # Modern Smartphone Screens (iPhone, Samsung Galaxy, Pixel)
    (1170, 2532), (2532, 1170),  # iPhone 12/13/14
    (1179, 2556), (2556, 1179),  # iPhone 14/15 Pro
    (1284, 2778), (2778, 1284),  # iPhone 12/13/14 Pro Max
    (1290, 2796), (2796, 1290),  # iPhone 14/15 Pro Max
    (1080, 2400), (2400, 1080),  # Popular Android 20:9
    (1080, 2340), (2340, 1080),  # Android 19.5:9
    (1440, 3200), (3200, 1440),  # Samsung QHD+
    (1440, 3120), (3120, 1440),  # Pixel Pro
    (1080, 2412), (2412, 1080),  # OnePlus / Realme
    (1220, 2712), (2712, 1220),  # Xiaomi 1.5K
}

EDITING_SOFTWARE_KEYWORDS = [
    "photoshop", "gimp", "canva", "coreldraw", "lightroom", "pixlr",
    "snapseed", "picsart", "illustrator", "paint.net", "photopea",
    "affinity", "seashore", "inkscape"
]

SCREENSHOT_KEYWORDS = [
    "screenshot", "snipping", "screen capture", "lightshot", "sharex",
    "screencap", "greenshot", "flameshot", "grab", "prntscr"
]


class DocumentSourceVerifier:
    """Performs non-destructive structural inspection of PDF and image files."""

    @staticmethod
    def inspect_raw_image_exif(raw_bytes: bytes) -> Dict[str, Any]:
        """Extracts and parses EXIF metadata directly from raw un-sanitized bytes."""
        exif_info: Dict[str, Any] = {
            "has_exif": False,
            "camera_make": None,
            "camera_model": None,
            "software": None,
            "datetime_original": None,
            "lens_model": None,
            "orientation": None,
            "raw_tags": {},
        }
        try:
            with Image.open(io.BytesIO(raw_bytes)) as pil_img:
                raw_exif = pil_img.getexif()
                if not raw_exif:
                    return exif_info

                exif_info["has_exif"] = True
                for tag_id, value in raw_exif.items():
                    tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                    if isinstance(value, bytes):
                        try:
                            value = value.decode("utf-8", errors="ignore").strip()
                        except Exception:
                            value = str(value)
                    exif_info["raw_tags"][tag_name] = str(value)[:120]

                    if tag_name == "Make" and not exif_info["camera_make"]:
                        exif_info["camera_make"] = str(value).strip()
                    elif tag_name == "Model" and not exif_info["camera_model"]:
                        exif_info["camera_model"] = str(value).strip()
                    elif tag_name == "Software" and not exif_info["software"]:
                        exif_info["software"] = str(value).strip()
                    elif tag_name in ("DateTimeOriginal", "DateTime") and not exif_info["datetime_original"]:
                        exif_info["datetime_original"] = str(value).strip()
                    elif tag_name == "Orientation" and not exif_info["orientation"]:
                        exif_info["orientation"] = str(value).strip()

        except Exception as e:
            logger.debug("EXIF parsing bypassed or failed: %s", str(e))

        return exif_info

    @staticmethod
    def inspect_image_source(
        raw_bytes: bytes,
        filename: str = "",
        width: int = 0,
        height: int = 0,
    ) -> Dict[str, Any]:
        """Evaluates image container characteristics for camera vs screenshot signals."""
        exif_data = DocumentSourceVerifier.inspect_raw_image_exif(raw_bytes)
        evidence_signals: List[str] = []
        is_screenshot = False
        editing_software_detected = None

        # 1. Inspect dimensions for exact match with standard display resolutions
        if (width, height) in COMMON_SCREEN_RESOLUTIONS:
            is_screenshot = True
            evidence_signals.append(f"Image dimensions ({width}x{height}) match exact common screen display resolution")

        # 2. Inspect filename for screenshot indicators
        fn_lower = filename.lower()
        if any(kw in fn_lower for kw in SCREENSHOT_KEYWORDS):
            is_screenshot = True
            evidence_signals.append(f"Filename '{filename}' indicates screen capture utility")

        # 3. Check for editing software tags in EXIF
        software_field = (exif_data.get("software") or "").lower()
        for editor in EDITING_SOFTWARE_KEYWORDS:
            if editor in software_field:
                editing_software_detected = exif_data["software"]
                evidence_signals.append(f"EXIF Software metadata indicates graphics editor: {exif_data['software']}")
                break

        # 4. Check for camera hardware metadata
        camera_found = bool(exif_data.get("camera_make") or exif_data.get("camera_model"))
        if camera_found:
            evidence_signals.append(
                f"Camera capture metadata detected: {exif_data.get('camera_make', '')} {exif_data.get('camera_model', '')}".strip()
            )

        # 5. Formulate status
        if editing_software_detected:
            status = "STRUCTURAL ANOMALY"
            confidence = 82.0
            description = f"Container modified with graphics software ({editing_software_detected})"
        elif is_screenshot:
            status = "POSSIBLE SCAN/SCREENSHOT"
            confidence = 78.0
            description = "Structural indicators suggest display screen capture rather than optical document capture"
        elif camera_found:
            status = "ORIGINAL-LIKE STRUCTURE"
            confidence = 88.0
            description = "Physical optical camera capture characteristics verified in image metadata"
        else:
            status = "UNABLE TO DETERMINE"
            confidence = 50.0
            description = "Metadata absent or stripped; container integrity inconclusive (common in privacy tools and chat apps)"

        return {
            "status": status,
            "confidence": confidence,
            "description": description,
            "is_screenshot": is_screenshot,
            "camera_metadata_found": camera_found,
            "camera_details": (
                f"{exif_data.get('camera_make', '')} {exif_data.get('camera_model', '')}".strip()
                if camera_found else None
            ),
            "editing_software": editing_software_detected,
            "has_exif": exif_data["has_exif"],
            "evidence_signals": evidence_signals,
            "limitations": (
                "EXIF and container metadata are heuristic signals. "
                "Absence of EXIF does NOT prove forgery as messaging applications routinely strip metadata."
            ),
        }

    @staticmethod
    def inspect_pdf_source(raw_bytes: bytes, filename: str = "") -> Dict[str, Any]:
        """Inspects structural PDF elements (AcroForms, digital signature fields, metadata)."""
        evidence: List[str] = []
        signature_fields_found = False
        signature_count = 0
        has_acroform = False
        producer = None
        creator = None

        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(raw_bytes))
            metadata = reader.metadata or {}

            producer = str(metadata.get("/Producer", "")).strip() or None
            creator = str(metadata.get("/Creator", "")).strip() or None

            if producer:
                evidence.append(f"PDF Producer: {producer}")
            if creator:
                evidence.append(f"PDF Creator: {creator}")

            # Check for digital signature fields (/Sig or /ByteRange)
            root_obj = reader.trailer.get("/Root", {})
            if hasattr(root_obj, "get_object"):
                root_obj = root_obj.get_object()

            if "/AcroForm" in root_obj:
                has_acroform = True
                acroform = root_obj["/AcroForm"]
                if hasattr(acroform, "get_object"):
                    acroform = acroform.get_object()

                fields = acroform.get("/Fields", [])
                for f_ref in fields:
                    f_obj = f_ref.get_object() if hasattr(f_ref, "get_object") else f_ref
                    if isinstance(f_obj, dict) and f_obj.get("/FT") == "/Sig":
                        signature_fields_found = True
                        signature_count += 1

            # Also scan raw bytes for signature dictionary anchors
            if not signature_fields_found and (b"/ByteRange" in raw_bytes and b"/Contents" in raw_bytes):
                signature_fields_found = True
                signature_count = 1

            if signature_fields_found:
                evidence.append(f"Digital signature field structure detected ({signature_count} field(s))")

            page_count = len(reader.pages)
            evidence.append(f"PDF Document: {page_count} page(s)")

            status = "ORIGINAL-LIKE STRUCTURE" if signature_fields_found else "ORIGINAL-LIKE STRUCTURE"
            description = (
                "Digital PDF document structure parsed successfully. "
                + (f"Contains {signature_count} digital signature structure(s)." if signature_fields_found else "No digital signature fields detected.")
            )

        except Exception as e:
            logger.warning("PDF structural inspection encountered an error: %s", str(e))
            status = "UNABLE TO DETERMINE"
            description = f"PDF structural inspection incomplete: {str(e)}"
            evidence.append("PDF parsing error")

        return {
            "status": status,
            "confidence": 85.0 if signature_fields_found else 70.0,
            "description": description,
            "signature_structure_detected": signature_fields_found,
            "signature_count": signature_count,
            "has_acroform": has_acroform,
            "producer": producer,
            "creator": creator,
            "evidence_signals": evidence,
            "limitations": (
                "Document Source Verification analyzes structural PDF elements. "
                "It does NOT perform cryptographic government CA certificate validation or "
                "DigiLocker server verification without live government gateway integration."
            ),
        }
