"""DocShield AI — File Validation & Upload Security Unit Tests."""

import io
import pytest
from PIL import Image
from app.security.file_validation import (
    validate_and_reencode_image,
    FileValidationError,
    detect_mime_from_magic_bytes,
)


def create_test_image(format="JPEG", size=(200, 200), color=(255, 0, 0)) -> io.BytesIO:
    """Helper to generate in-memory valid image streams."""
    stream = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(stream, format=format)
    stream.seek(0)
    return stream


def test_valid_jpeg_accepted_and_reencoded():
    """Confirms genuine JPEG is validated and re-encoded without errors."""
    stream = create_test_image("JPEG")
    clean_img, clean_bytes, fmt = validate_and_reencode_image(stream)

    assert fmt == "JPEG"
    assert clean_img.size == (200, 200)
    assert len(clean_bytes) > 0
    # Clean bytes must have valid JPEG magic header
    assert clean_bytes.startswith(b"\xFF\xD8\xFF")


def test_valid_png_accepted_and_reencoded():
    """Confirms genuine PNG is converted and safely re-encoded to JPEG."""
    stream = create_test_image("PNG")
    clean_img, clean_bytes, fmt = validate_and_reencode_image(stream)

    assert fmt == "JPEG"
    assert clean_img.size == (200, 200)
    assert clean_bytes.startswith(b"\xFF\xD8\xFF")


def test_fake_image_exe_binary_rejected():
    """Simulates an executable file masked with image extension."""
    fake_stream = io.BytesIO(b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00")
    with pytest.raises(FileValidationError, match="Potentially malicious file detected"):
        validate_and_reencode_image(fake_stream)


def test_fake_image_elf_binary_rejected():
    """Simulates a Linux ELF binary masked as an image."""
    fake_stream = io.BytesIO(b"\x7fELF\x02\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00")
    with pytest.raises(FileValidationError, match="Potentially malicious file detected"):
        validate_and_reencode_image(fake_stream)


def test_svg_script_injection_rejected():
    """Simulates an SVG file attempting XML/XSS vector."""
    svg_stream = io.BytesIO(b"<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>")
    with pytest.raises(FileValidationError, match="Potentially malicious file detected"):
        validate_and_reencode_image(svg_stream)


def test_empty_file_rejected():
    """Verifies 0-byte file rejection."""
    empty_stream = io.BytesIO(b"")
    with pytest.raises(FileValidationError, match="empty"):
        validate_and_reencode_image(empty_stream)


def test_decompression_bomb_rejected():
    """Simulates an image with dimensions exceeding MAX_IMAGE_DIMENSION (8000px)."""
    # Create image with declared dimensions 8500 x 100
    huge_stream = io.BytesIO()
    img = Image.new("RGB", (8500, 100), color=(100, 100, 100))
    img.save(huge_stream, format="JPEG")
    huge_stream.seek(0)

    with pytest.raises(FileValidationError, match="Decompression bomb defense"):
        validate_and_reencode_image(huge_stream, max_dimension=8000)


def test_jpg_and_jpeg_variants_accepted():
    """Confirms both .jpg and .jpeg standard camera images are accepted."""
    for fmt in ["JPEG", "PNG"]:
        stream = create_test_image(fmt, size=(1920, 1080))
        clean_img, clean_bytes, verified_fmt = validate_and_reencode_image(
            stream, max_size_bytes=16 * 1024 * 1024
        )
        assert verified_fmt == "JPEG"
        assert clean_img.size == (1920, 1080)
        assert len(clean_bytes) > 0

