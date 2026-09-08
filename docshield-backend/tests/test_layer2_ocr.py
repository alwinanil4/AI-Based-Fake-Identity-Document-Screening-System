"""DocShield AI — Layer 2 OCR and MRZ Unit Tests."""

from PIL import Image
from app.layers.layer2_ocr import (
    compute_icao_check_digit,
    MRZValidator,
    OCRForensicExtractor,
    run_layer2_analysis,
)


def test_icao_check_digit_calculation():
    """Verifies check digit calculation per ICAO Doc 9303 (7-3-1 weight algorithm)."""
    # Example: Passport number L898902C3 with check digit 6
    # 'L' = 21 * 7 = 147
    # '8' = 8 * 3 = 24
    # '9' = 9 * 1 = 9 ...
    assert compute_icao_check_digit("L898902C3") == 6
    # Date of birth 740812 with check digit 2
    assert compute_icao_check_digit("740812") == 2
    # Expiry date 120415 with check digit 9
    assert compute_icao_check_digit("120415") == 9


def test_valid_td3_mrz_validation():
    """Verifies parsing of a genuine TD3 (Passport) MRZ."""
    lines = [
        "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<",
        "L898902C36UTO7408122F1204159ZE184226B<<<<<10",
    ]
    res = MRZValidator.parse_and_validate(lines)

    assert res["mrz_detected"] is True
    assert res["format"] == "TD3"
    assert res["document_type"] == "passport"
    assert res["mrz_checksum_valid"] is True
    assert res["document_number"] == "L898902C3"
    assert "ANNA MARIA ERIKSSON" in res["holder_name"]
    assert len(res["anomalies"]) == 0


def test_tampered_mrz_detected():
    """Verifies that an altered date of birth or passport number fails checksum."""
    # Alter DOB check digit from 2 to 9 (tampered birth date)
    lines = [
        "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<",
        "L898902C36UTO7408129F1204159ZE184226B<<<<<10",
    ]
    res = MRZValidator.parse_and_validate(lines)

    assert res["mrz_detected"] is True
    assert res["mrz_checksum_valid"] is False
    assert any("tampered DOB" in a for a in res["anomalies"])


def test_document_classification():
    """Verifies heuristic statutory classification."""
    assert OCRForensicExtractor.classify_document_type("Government of India Unique Identification Authority Aadhaar") == "aadhaar"
    assert OCRForensicExtractor.classify_document_type("Republic of India Passport") == "passport"
    assert OCRForensicExtractor.classify_document_type("Income Tax Department Permanent Account Number") == "pan_card"
    assert OCRForensicExtractor.classify_document_type("Union of India Driving Licence Transport Department") == "driving_license"


def test_layer2_run_on_blank_image():
    """Verifies layer 2 execution produces a complete, compliant dictionary structure."""
    img = Image.new("RGB", (400, 300), color=(255, 255, 255))
    res = run_layer2_analysis(img)

    assert "status" in res
    assert "confidence" in res
    assert "document_type" in res
    assert "fields" in res
    assert "anomalies" in res
    assert isinstance(res["anomalies"], list)
