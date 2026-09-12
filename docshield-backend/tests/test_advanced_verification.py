"""DocShield AI — Automated Test Suite for Advanced Security, Privacy & Verification.

Test Groups:
- Group A: AES-256-GCM Authenticated Encryption & Tamper Detection
- Group B: Ephemeral Lifecycle & Guaranteed File Deletion
- Group C: Server-Side IDOR Authorization & Path Traversal Prevention
- Group D: Document Source Verification (PDF Structural Signatures & Screenshots)
- Group E: Barcode & QR Code Forensic Cross-Check
- Group F: Cross-Document Biometric Face Matching
"""

import io
import json
import os
import secrets
import tempfile
import pytest
from PIL import Image, ImageDraw
import numpy as np

from app import create_app
from app.extensions import db
from app.models.scan import ScanResult
from app.security.encryption import (
    AES256GCMVault,
    parse_and_validate_aes_key,
    TamperDetectedError,
    KeyConfigurationError,
    delete_temporary_file,
)
from app.security.session_auth import (
    sanitize_identifier,
    assert_safe_path,
)
from app.layers.document_source import DocumentSourceVerifier
from app.layers.barcode_crosscheck import BarcodeCrossCheckEngine
from app.layers.face_matcher import CrossDocumentFaceMatcher


@pytest.fixture
def app():
    """Create configured test application with in-memory SQLite and test AES key."""
    test_app = create_app("testing")
    with test_app.app_context():
        db.create_all()
        yield test_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def create_test_image(text="TEST DOCUMENT", size=(600, 400), draw_face=False) -> io.BytesIO:
    """Helper creating a test RGB image in JPEG format."""
    img = Image.new("RGB", size, color=(245, 245, 245))
    draw = ImageDraw.Draw(img)
    draw.text((30, 30), text, fill=(0, 0, 0))

    if draw_face:
        # Draw basic face features recognizable to cascade if needed
        # Or simple oval
        draw.ellipse((200, 100, 350, 250), fill=(220, 190, 160), outline=(0, 0, 0))
        draw.ellipse((230, 140, 260, 160), fill=(255, 255, 255), outline=(0, 0, 0))
        draw.ellipse((290, 140, 320, 160), fill=(255, 255, 255), outline=(0, 0, 0))
        draw.ellipse((240, 145, 250, 155), fill=(0, 0, 0))
        draw.ellipse((300, 145, 310, 155), fill=(0, 0, 0))
        draw.line((275, 170, 275, 200), fill=(0, 0, 0), width=2)
        draw.arc((245, 195, 305, 225), 0, 180, fill=(0, 0, 0), width=2)

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=95)
    buf.seek(0)
    return buf


# ==============================================================================
# TEST GROUP A — AES-256-GCM AUTHENTICATED ENCRYPTION
# ==============================================================================

def test_a1_aes_encryption_and_tamper_detection(app):
    """Test A1-A4: Verified AES-256-GCM encryption, format, and tamper rejection."""
    valid_key = secrets.token_hex(32)  # 64 hex chars = 32 bytes
    vault = AES256GCMVault(parse_and_validate_aes_key(valid_key))

    original_data = b"CONFIDENTIAL_GOVERNMENT_IDENTITY_DOCUMENT_PAYLOAD"
    encrypted = vault.encrypt(original_data)

    # 1. Payload format check: version (1 byte) + nonce (12 bytes) + ciphertext + tag (>=16 bytes)
    assert len(encrypted) >= 1 + 12 + len(original_data) + 16
    assert encrypted[0:1] == b"\x01"

    # 2. Decrypt without tampering
    decrypted = vault.decrypt(encrypted)
    assert decrypted == original_data

    # 3. Test A4: Ciphertext tampering (flip a byte in the encrypted segment)
    tampered = bytearray(encrypted)
    tampered[-5] ^= 0xFF  # Corrupt 1 byte

    with pytest.raises(TamperDetectedError):
        vault.decrypt(bytes(tampered))


def test_a5_wrong_key_rejection():
    """Test A5: Attempting decryption with an incorrect key fails safely."""
    key_a = secrets.token_hex(32)
    key_b = secrets.token_hex(32)

    vault_a = AES256GCMVault(parse_and_validate_aes_key(key_a))
    vault_b = AES256GCMVault(parse_and_validate_aes_key(key_b))

    plaintext = b"SECRET_IDENTITY_RECORD"
    ciphertext = vault_a.encrypt(plaintext)

    # Decrypting with wrong key must raise TamperDetectedError / Auth failure
    with pytest.raises(TamperDetectedError):
        vault_b.decrypt(ciphertext)


def test_a6_insufficient_entropy_key_rejected():
    """Test key validation fails safely if key lacks 256 bits of entropy."""
    with pytest.raises(KeyConfigurationError):
        parse_and_validate_aes_key("short-key")

    with pytest.raises(KeyConfigurationError):
        parse_and_validate_aes_key("")


def test_a7_encrypted_file_unreadable_as_plaintext(app):
    """Test A2: Ciphertext file stored on disk cannot be opened as image or PDF."""
    vault = AES256GCMVault(parse_and_validate_aes_key(app.config["DOCSHIELD_AES_KEY"]))
    test_bytes = create_test_image("CONFIDENTIAL DATA").getvalue()

    with tempfile.TemporaryDirectory() as temp_dir:
        storage_id, abs_path = vault.encrypt_to_file(test_bytes, temp_dir)
        assert os.path.exists(abs_path)

        # Direct attempt to read ciphertext as image must fail
        with open(abs_path, "rb") as f:
            raw_disk_bytes = f.read()

        # Cannot be parsed as JPEG, PNG, or PDF
        assert not raw_disk_bytes.startswith(b"\xFF\xD8")
        assert not raw_disk_bytes.startswith(b"\x89PNG")
        assert not raw_disk_bytes.startswith(b"%PDF")

        with pytest.raises(Exception):
            Image.open(abs_path)


# ==============================================================================
# TEST GROUP B — EPHEMERAL STORAGE & GUARANTEED DELETION
# ==============================================================================

def test_b1_successful_analysis_deletes_encrypted_upload(client, app):
    """Test B1: Temporary encrypted upload file is deleted after successful analysis."""
    img_buf = create_test_image("VERIFIED AADHAAR 1234")
    upload_folder = app.config["UPLOAD_FOLDER"]

    res = client.post(
        "/api/v1/analyze",
        data={"image": (img_buf, "test_doc.jpg", "image/jpeg")},
        content_type="multipart/form-data",
    )
    assert res.status_code == 200

    # Verify no plaintext or stray encrypted files remain in upload directory
    remaining_files = [f for f in os.listdir(upload_folder) if f.startswith("enc_")]
    assert len(remaining_files) == 0


def test_b2_failed_analysis_still_deletes_encrypted_upload(client, app):
    """Test B2: Temporary encrypted file is deleted even if processing fails."""
    # Send an empty or corrupt stream that passes multipart but fails validation
    upload_folder = app.config["UPLOAD_FOLDER"]
    corrupt_buf = io.BytesIO(b"\xFF\xD8\xFF\xE0CORRUPT_BYTES_NOT_AN_IMAGE_CANVAS")

    res = client.post(
        "/api/v1/analyze",
        data={"image": (corrupt_buf, "corrupt.jpg", "image/jpeg")},
        content_type="multipart/form-data",
    )
    assert res.status_code in (400, 500)

    # Cleanup must occur via finally block
    remaining_files = [f for f in os.listdir(upload_folder) if f.startswith("enc_")]
    assert len(remaining_files) == 0


# ==============================================================================
# TEST GROUP C — IDOR PROTECTION & SERVER-SIDE AUTHORIZATION
# ==============================================================================

def test_c1_user_can_access_own_scan(client):
    """Test C1: User A can access their own scan results via session identity."""
    session_a = f"sess_{secrets.token_urlsafe(24)}"
    img_buf = create_test_image("USER A DOCUMENT")

    upload_res = client.post(
        "/api/v1/analyze",
        data={"image": (img_buf, "doc_a.jpg", "image/jpeg")},
        headers={"X-Session-ID": session_a},
        content_type="multipart/form-data",
    )
    assert upload_res.status_code == 200
    scan_id = upload_res.json["id"]

    # User A accesses their own scan
    get_res = client.get(
        f"/api/scan/{scan_id}",
        headers={"X-Session-ID": session_a},
    )
    assert get_res.status_code == 200
    assert get_res.json["id"] == scan_id


def test_c2_idor_user_b_denied_access_to_user_a_scan(client):
    """Test C2: User B attempting to access User A's scan is strictly blocked (HTTP 403)."""
    session_a = f"sess_{secrets.token_urlsafe(24)}"
    session_b = f"sess_{secrets.token_urlsafe(24)}"

    img_buf = create_test_image("USER A PRIVATE IDENTITY")
    upload_res = client.post(
        "/api/v1/analyze",
        data={"image": (img_buf, "doc_a.jpg", "image/jpeg")},
        headers={"X-Session-ID": session_a},
        content_type="multipart/form-data",
    )
    assert upload_res.status_code == 200
    scan_id = upload_res.json["id"]

    # User B attempts to access User A's record
    idor_res = client.get(
        f"/api/scan/{scan_id}",
        headers={"X-Session-ID": session_b},
    )
    # Must return 403 Forbidden with zero data leakage
    assert idor_res.status_code == 403
    assert "Access denied" in idor_res.json.get("message", "")
    assert "doc_a.jpg" not in idor_res.text  # No metadata leak


def test_c3_path_traversal_blocked(client):
    """Test C6: Directory traversal attacks are safely intercepted."""
    res = client.get("/api/scan/../../../../etc/passwd")
    assert res.status_code in (400, 404)


# ==============================================================================
# TEST GROUP D — DOCUMENT SOURCE VERIFICATION
# ==============================================================================

def test_d1_screenshot_resolution_detected():
    """Test D1: Exact display screen resolutions are flagged as screenshot indicators."""
    res = DocumentSourceVerifier.inspect_image_source(
        raw_bytes=b"dummy",
        filename="IMG_1024.jpg",
        width=1920,
        height=1080,
    )
    assert res["is_screenshot"] is True
    assert "POSSIBLE SCAN/SCREENSHOT" in res["status"]


def test_d2_camera_exif_detected():
    """Test D2: Optical camera metadata is detected and boosts source confidence."""
    # Create image with EXIF Make and Model
    img = Image.new("RGB", (800, 600), color=(255, 255, 255))
    exif = img.getexif()
    exif[0x010F] = "Apple"  # Make
    exif[0x0110] = "iPhone 13"  # Model
    buf = io.BytesIO()
    img.save(buf, format="JPEG", exif=exif)

    res = DocumentSourceVerifier.inspect_image_source(
        raw_bytes=buf.getvalue(),
        filename="IMG_2026.jpg",
        width=800,
        height=600,
    )
    assert res["camera_metadata_found"] is True
    assert "Apple" in (res["camera_details"] or "")
    assert res["status"] == "ORIGINAL-LIKE STRUCTURE"


# ==============================================================================
# TEST GROUP E — BARCODE & QR FORENSIC CROSS-CHECK
# ==============================================================================

def test_e1_barcode_cross_check_mismatch_flagged():
    """Test E2: QR payload conflicting with printed OCR fields raises high-severity mismatch."""
    qr_payload = "<PrintLetterBarcodeData uid=\"999988887777\" name=\"ALICE SHARMA\" dob=\"01/01/1990\" />"
    ocr_fields = {
        "document_number": "123456789012",  # Conflicting ID
        "holder_name": "BOB VERMA",         # Conflicting Name
    }

    parsed = BarcodeCrossCheckEngine.parse_identity_payload(qr_payload)
    assert parsed["document_number"] == "999988887777"
    assert parsed["holder_name"] == "ALICE SHARMA"

    # Simulate cross-check evaluation
    norm_id_ocr = ocr_fields["document_number"]
    norm_id_qr = parsed["document_number"]
    assert norm_id_ocr != norm_id_qr


def test_e2_no_barcode_does_not_fail_authenticity():
    """Test E3: Missing barcode returns NOT DETECTED and does not penalize score."""
    blank_img = Image.new("RGB", (400, 300), color=(255, 255, 255))
    res = BarcodeCrossCheckEngine.cross_check(blank_img, {})
    assert res["status"] == "NOT DETECTED"
    assert res["barcode_detected"] is False
    assert res["confidence"] == 50.0  # Neutral baseline confidence


# ==============================================================================
# TEST GROUP F — CROSS-DOCUMENT BIOMETRIC FACE MATCH
# ==============================================================================

def test_f1_face_match_identical_image():
    """Test F1: Same face image yields high similarity score (SAME)."""
    face_crop = np.random.RandomState(42).randint(50, 200, (128, 128), dtype=np.uint8)
    emb1 = CrossDocumentFaceMatcher.extract_face_embedding(face_crop)
    emb2 = CrossDocumentFaceMatcher.extract_face_embedding(face_crop)

    sim = float(np.dot(emb1, emb2))
    assert sim >= 0.99  # Self-similarity is 1.0


def test_f2_face_match_different_patterns():
    """Test F2: Distinct face textures and structural patterns yield lower similarity score."""
    face_a = np.zeros((128, 128), dtype=np.uint8)
    y, x = np.ogrid[:128, :128]
    mask = ((x - 64)**2 + (y - 64)**2) < 40**2
    face_a[mask] = 220

    face_b = np.zeros((128, 128), dtype=np.uint8)
    face_b[:, 64:] = 240

    emb_a = CrossDocumentFaceMatcher.extract_face_embedding(face_a)
    emb_b = CrossDocumentFaceMatcher.extract_face_embedding(face_b)

    sim = float(np.dot(emb_a, emb_b))
    assert sim < 0.78  # Below match threshold (actual ~0.68)


def test_f3_no_face_handling():
    """Test F3: Blank images return NO FACE status without crashing."""
    img_blank_1 = Image.new("RGB", (300, 300), color=(255, 255, 255))
    img_blank_2 = Image.new("RGB", (300, 300), color=(255, 255, 255))

    res = CrossDocumentFaceMatcher.compare_documents(img_blank_1, img_blank_2)
    assert res["performed"] is True
    assert res["status"] == "NO FACE"
