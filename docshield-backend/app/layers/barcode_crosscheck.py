"""DocShield AI — Barcode and QR Code Forensic Cross-Check Layer.

Extracts encoded payloads from QR codes and 1D barcodes, parses structured
identity data (e.g. Aadhaar XML, PAN QR, JSON), and executes field-aware
cross-verification against visible OCR text fields.
"""

import logging
import re
import xml.etree.ElementTree as ET
from typing import Dict, Any, List, Optional, Tuple
import cv2
import numpy as np
from PIL import Image

try:
    from pyzbar.pyzbar import decode as pyzbar_decode
except ImportError:
    pyzbar_decode = None

logger = logging.getLogger(__name__)


class BarcodeCrossCheckEngine:
    """Multi-pass barcode decoder and field-aware OCR cross-verifier."""

    @staticmethod
    def decode_codes(image: Image.Image) -> List[Dict[str, Any]]:
        """Extracts barcodes/QRs using multi-pass image processing."""
        if pyzbar_decode is None:
            return []

        results = []
        # Pass 1: Direct decode
        try:
            raw_codes = pyzbar_decode(image)
            for c in raw_codes:
                try:
                    payload_str = c.data.decode("utf-8", errors="ignore")
                except Exception:
                    payload_str = str(c.data)
                results.append({
                    "type": c.type,
                    "data": payload_str,
                    "rect": (c.rect.left, c.rect.top, c.rect.width, c.rect.height),
                })
        except Exception as e:
            logger.debug("Pass 1 barcode decode error: %s", str(e))

        if results:
            return results

        # Pass 2: OpenCV Preprocessing (CLAHE + Otsu Thresholding)
        try:
            img_np = np.array(image.convert("RGB"))
            gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)

            # CLAHE contrast enhancement
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(gray)
            _, thresh = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

            processed_pil = Image.fromarray(thresh)
            raw_codes = pyzbar_decode(processed_pil)
            for c in raw_codes:
                try:
                    payload_str = c.data.decode("utf-8", errors="ignore")
                except Exception:
                    payload_str = str(c.data)
                results.append({
                    "type": c.type,
                    "data": payload_str,
                    "rect": (c.rect.left, c.rect.top, c.rect.width, c.rect.height),
                })
        except Exception as e:
            logger.debug("Pass 2 barcode decode error: %s", str(e))

        return results

    @staticmethod
    def parse_identity_payload(payload: str) -> Dict[str, Optional[str]]:
        """Parses decoded QR payload for standard identity fields."""
        extracted: Dict[str, Optional[str]] = {
            "document_number": None,
            "holder_name": None,
            "date_of_birth": None,
            "gender": None,
            "format": "raw_text",
        }
        if not payload:
            return extracted

        clean_p = payload.strip()

        # 1. Aadhaar XML format (<PrintLetterBarcodeData ... />)
        if "<PrintLetterBarcodeData" in clean_p or "<?xml" in clean_p:
            try:
                # Isolate xml element
                xml_match = re.search(r"<PrintLetterBarcodeData[^>]*\/?>", clean_p)
                if xml_match:
                    root = ET.fromstring(xml_match.group(0))
                    extracted["document_number"] = root.get("uid")
                    extracted["holder_name"] = root.get("name")
                    extracted["date_of_birth"] = root.get("dob")
                    extracted["gender"] = root.get("gender")
                    extracted["format"] = "aadhaar_xml"
                    return extracted
            except Exception as e:
                logger.debug("Aadhaar XML parsing fallback: %s", str(e))

        # 2. PAN format (contains 10-char alphanumeric e.g. ABCDE1234F)
        pan_match = re.search(r"\b([A-Z]{5}[0-9]{4}[A-Z])\b", clean_p)
        if pan_match:
            extracted["document_number"] = pan_match.group(1)
            extracted["format"] = "pan_qr"

        # 3. Aadhaar numeric or UIDAI text pattern (12 digits)
        uid_match = re.search(r"\b([2-9][0-9]{3}\s?[0-9]{4}\s?[0-9]{4})\b", clean_p)
        if uid_match and not extracted["document_number"]:
            extracted["document_number"] = uid_match.group(1).replace(" ", "")
            extracted["format"] = "aadhaar_qr"

        # 4. Extract DOB if present in QR text
        dob_match = re.search(r"\b([0-3]?[0-9][/-][0-1]?[0-9][/-][12][09][0-9]{2})\b", clean_p)
        if dob_match and not extracted["date_of_birth"]:
            extracted["date_of_birth"] = dob_match.group(1)

        return extracted

    @staticmethod
    def cross_check(
        image: Image.Image,
        ocr_fields: Dict[str, Any],
        doc_type: str = "unknown",
    ) -> Dict[str, Any]:
        """Performs full barcode detection, payload parsing, and OCR comparison."""
        detected_codes = BarcodeCrossCheckEngine.decode_codes(image)

        if not detected_codes:
            return {
                "status": "NOT DETECTED",
                "confidence": 50.0,
                "barcode_detected": False,
                "code_type": None,
                "matched_fields": [],
                "mismatched_fields": [],
                "details": "No barcode or QR code detected on the document surface",
                "severity": "info",
                "limitations": "Absence of barcode does not constitute tampering; many documents feature barcodes exclusively on verso or unencoded variants.",
            }

        # Take first decodable code with identity payload
        primary_code = detected_codes[0]
        code_type = primary_code["type"]
        payload = primary_code["data"]
        parsed_payload = BarcodeCrossCheckEngine.parse_identity_payload(payload)

        matched_fields: List[str] = []
        mismatched_fields: List[str] = []
        comparison_evidence: List[str] = []

        # Helper: Clean identifier for comparison
        def norm_id(val: Optional[str]) -> str:
            if not val:
                return ""
            return re.sub(r"[^A-Za-z0-9]", "", val).upper()

        # Helper: Clean name for comparison
        def norm_name(val: Optional[str]) -> str:
            if not val:
                return ""
            return re.sub(r"[^A-Za-z]", "", val).upper()

        # 1. Document Number Comparison
        ocr_doc_num = norm_id(ocr_fields.get("document_number"))
        qr_doc_num = norm_id(parsed_payload.get("document_number"))

        if qr_doc_num and ocr_doc_num:
            if qr_doc_num == ocr_doc_num or qr_doc_num in ocr_doc_num or ocr_doc_num in qr_doc_num:
                matched_fields.append("document_number")
                comparison_evidence.append(f"Document ID matches: '{ocr_fields.get('document_number')}'")
            else:
                mismatched_fields.append("document_number")
                comparison_evidence.append(
                    f"CRITICAL MISMATCH: Printed document ID '{ocr_fields.get('document_number')}' "
                    f"conflicts with encoded QR ID '{parsed_payload.get('document_number')}'"
                )

        # 2. Name Comparison
        ocr_name = norm_name(ocr_fields.get("holder_name"))
        qr_name = norm_name(parsed_payload.get("holder_name"))

        if qr_name and ocr_name:
            if qr_name == ocr_name or qr_name in ocr_name or ocr_name in qr_name:
                matched_fields.append("holder_name")
                comparison_evidence.append(f"Citizen Name matches: '{ocr_fields.get('holder_name')}'")
            else:
                mismatched_fields.append("holder_name")
                comparison_evidence.append(
                    f"CRITICAL MISMATCH: Printed Name '{ocr_fields.get('holder_name')}' "
                    f"conflicts with encoded QR Name '{parsed_payload.get('holder_name')}'"
                )

        # 3. Determine Cross-Check Status
        if mismatched_fields:
            status = "MISMATCH"
            confidence = 98.0
            severity = "critical"
            details = "High-severity integrity signal: Encoded barcode data directly conflicts with printed document details"
        elif matched_fields:
            status = "MATCH"
            confidence = 95.0
            severity = "positive"
            details = f"Barcode/QR data matches printed information ({', '.join(matched_fields)})"
        else:
            status = "MATCH" if len(payload) > 10 else "UNREADABLE"
            confidence = 70.0
            severity = "info"
            details = f"Barcode ({code_type}) detected and decoded ({len(payload)} bytes payload)"

        return {
            "status": status,
            "confidence": confidence,
            "barcode_detected": True,
            "code_type": code_type,
            "payload_format": parsed_payload.get("format"),
            "matched_fields": matched_fields,
            "mismatched_fields": mismatched_fields,
            "comparison_evidence": comparison_evidence,
            "details": details,
            "severity": severity,
            "limitations": (
                "Barcode consistency verifies that visual print matches encoded data. "
                "It does NOT prove government database authenticity unless digitally verified by UIDAI/government gateway."
            ),
        }
