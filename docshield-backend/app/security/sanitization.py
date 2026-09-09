"""DocShield AI — Input Sanitization and Path Traversal Defenses.

Protects file system operations against directory traversal (../), null byte injections,
and malicious filename characters.
"""

import os
import re
import uuid
from pathlib import Path
from werkzeug.utils import secure_filename


class SecurityValidationError(ValueError):
    """Raised when an untrusted input fails security sanitization checks."""
    pass


def sanitize_filename(filename: str) -> str:
    """Sanitizes user-supplied filenames and ensures traversal sequences are rejected.

    NOTE: The core architecture ALWAYS generates a server-side UUID filename for storage.
    This sanitizer is an additional defense-in-depth barrier.
    """
    if not filename or not isinstance(filename, str):
        raise SecurityValidationError("Invalid filename: Must be a non-empty string.")

    # Guard against Null byte injection
    if "\0" in filename:
        raise SecurityValidationError("Potential attack detected: Null byte in filename.")

    # Guard against directory traversal sequences
    if ".." in filename or "/" in filename or "\\" in filename:
        raise SecurityValidationError("Potential directory traversal attack detected in filename.")

    # Clean using werkzeug secure_filename
    cleaned = secure_filename(filename)
    if not cleaned:
        raise SecurityValidationError("Filename does not contain safe characters.")

    return cleaned


def generate_safe_storage_name(original_filename: str = "") -> str:
    """Generates a non-guessable, collision-free UUID4 filename.

    Extracts and validates extension from original_filename if provided,
    defaulting to .jpg if missing or invalid.
    """
    ext = ".jpg"
    if original_filename and "." in original_filename:
        candidate_ext = Path(original_filename).suffix.lower()
        if candidate_ext in {".jpg", ".jpeg", ".png"}:
            ext = candidate_ext

    return f"{uuid.uuid4().hex}{ext}"


def assert_path_in_directory(file_path: str, base_directory: str) -> str:
    """Verifies that the resolved path is strictly contained within the intended base directory.

    Prevents directory traversal via symlinks or resolved canonical paths.
    """
    resolved_base = os.path.realpath(base_directory)
    resolved_target = os.path.realpath(file_path)

    # Check that the target path starts with the base directory path
    common = os.path.commonpath([resolved_base, resolved_target])
    if common != resolved_base:
        raise SecurityValidationError(
            f"Path traversal detected: Target '{file_path}' resolves outside base directory."
        )

    return resolved_target
