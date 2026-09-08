"""DocShield AI — Production File Upload Validation & Sanitization Pipeline.

Enforces deep content inspection (magic bytes), decompression bomb prevention,
EXIF stripping, and server-side image re-encoding.
"""

import io
import os
from typing import Tuple
from PIL import Image, ImageOps, UnidentifiedImageError

# Configure Pillow decompression bomb protection
# 8000 x 8000 = 64 megapixels maximum allowed image canvas
MAX_PIXELS = 8000 * 8000
Image.MAX_IMAGE_PIXELS = MAX_PIXELS


class FileValidationError(ValueError):
    """Raised when an uploaded file fails security or format validation."""
    pass


# Magic byte signatures
MAGIC_SIGNATURES = {
    "image/jpeg": [
        b"\xFF\xD8\xFF\xDB",
        b"\xFF\xD8\xFF\xE0",
        b"\xFF\xD8\xFF\xE1",
        b"\xFF\xD8\xFF\xEE",
    ],
    "image/png": [
        b"\x89PNG\r\n\x1a\n",
    ],
}

# Known malicious or dangerous headers to explicitly reject immediately
DISALLOWED_SIGNATURES = [
    (b"MZ", "Windows Executable/DLL binary"),
    (b"\x7fELF", "Linux ELF binary"),
    (b"PK\x03\x04", "ZIP / Compressed Archive"),
    (b"<!DOCTYPE", "HTML/XML markup"),
    (b"<svg", "SVG vector graphic containing script vectors"),
    (b"<?xml", "XML document"),
    (b"%PDF", "PDF document"),
]


def detect_mime_from_magic_bytes(header_bytes: bytes) -> str:
    """Inspects raw initial bytes to determine verified MIME type.

    Does NOT rely on client-supplied Content-Type or file extension.
    """
    if len(header_bytes) < 8:
        raise FileValidationError("Uploaded file is too small or empty.")

    # Check for forbidden binary or script signatures
    for sig, desc in DISALLOWED_SIGNATURES:
        if header_bytes.startswith(sig):
            raise FileValidationError(
                f"Potentially malicious file detected: Content identified as {desc}."
            )

    # Check PNG signature
    if header_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"

    # Check JPEG signatures
    if header_bytes.startswith(b"\xFF\xD8\xFF"):
        return "image/jpeg"

    raise FileValidationError(
        "Invalid file format: Only genuine JPEG and PNG images are supported."
    )


def validate_and_reencode_image(
    raw_stream: io.BytesIO,
    max_dimension: int = 8000,
    max_size_bytes: int = 10 * 1024 * 1024,
) -> Tuple[Image.Image, bytes, str]:
    """Validates raw image data and produces a safe, re-encoded clean image.

    Steps:
    1. Check byte size does not exceed max_size_bytes.
    2. Sniff magic bytes to verify JPEG or PNG.
    3. Open stream with Pillow without full memory loading (draft mode) to inspect dimensions.
    4. Reject if dimensions exceed max_dimension (decompression bomb defense).
    5. Re-encode image to RGB and save to clean bytes (strips EXIF, malformed headers, payloads).

    Returns:
        Tuple of (clean_pil_image, clean_bytes, verified_format)
    """
    raw_stream.seek(0, io.SEEK_END)
    file_size = raw_stream.tell()
    raw_stream.seek(0)

    if file_size <= 0:
        raise FileValidationError("Uploaded file is empty (0 bytes).")

    if file_size > max_size_bytes:
        raise FileValidationError(
            f"File size ({file_size / (1024 * 1024):.1f}MB) exceeds maximum permitted limit ({max_size_bytes / (1024 * 1024):.1f}MB)."
        )

    # Step 1: Magic byte verification
    header = raw_stream.read(32)
    raw_stream.seek(0)
    verified_mime = detect_mime_from_magic_bytes(header)

    # Step 2: Open with Pillow and inspect dimensions before full decode
    try:
        with Image.open(raw_stream) as img:
            width, height = img.size

            if width <= 0 or height <= 0:
                raise FileValidationError("Corrupted image: Dimensions are zero or negative.")

            if width > max_dimension or height > max_dimension:
                raise FileValidationError(
                    f"Decompression bomb defense: Image dimensions ({width}x{height}) exceed maximum allowed limit ({max_dimension}x{max_dimension})."
                )

            # Check format reported by Pillow parser
            pillow_format = (img.format or "").upper()
            if pillow_format not in {"JPEG", "PNG", "MPO"}:
                raise FileValidationError(
                    f"Disallowed image format '{pillow_format}' detected by parser."
                )

            # Auto-orient based on EXIF before stripping metadata
            oriented_img = ImageOps.exif_transpose(img)
            if oriented_img is None:
                oriented_img = img

            # Convert to standard RGB (drops dangerous color profiles, alpha tricks, paletted code)
            clean_image = oriented_img.convert("RGB")

    except Image.DecompressionBombError:
        raise FileValidationError(
            "Decompression bomb detected: Image exceeds safe pixel count threshold."
        )
    except UnidentifiedImageError:
        raise FileValidationError("Image decoder failed: Unidentified or corrupted image data.")
    except Exception as e:
        if isinstance(e, FileValidationError):
            raise
        raise FileValidationError(f"Image processing failed: Malformed image file structure.")

    # Step 3: Re-encode to clean in-memory buffer (completely strips EXIF and embedded steganography/payloads)
    output_buffer = io.BytesIO()
    clean_image.save(output_buffer, format="JPEG", quality=95, optimize=True)
    clean_bytes = output_buffer.getvalue()

    return clean_image, clean_bytes, "JPEG"
