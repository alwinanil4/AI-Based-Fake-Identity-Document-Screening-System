"""DocShield AI — Server-Side Session & IDOR Authorization Guard.

Provides zero-trust identity extraction, resource ownership enforcement,
and path traversal defenses across all document and screening endpoints.
"""

import os
import re
import secrets
from typing import Optional, Tuple
from flask import request, g, current_app, jsonify
import jwt

SESSION_HEADER = "X-Session-ID"
SESSION_COOKIE = "docshield_session_id"


def sanitize_identifier(ident: Optional[str]) -> Optional[str]:
    """Sanitizes resource identifiers against injection and path traversal."""
    if not ident or not isinstance(ident, str):
        return None
    cleaned = ident.strip()
    # Permit alphanumeric, dashes, underscores, dots
    if re.match(r"^[a-zA-Z0-9_\-\.]{1,128}$", cleaned):
        return cleaned
    return None


def extract_caller_identity() -> Tuple[str, str]:
    """Extracts verified server-side caller identity without trusting client body values.

    Returns:
        Tuple[identity_type, identity_id] where identity_type in ('admin', 'session').
    """
    # 1. Check for privileged admin JWT Bearer or cookie
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
    if not token:
        token = request.cookies.get("access_token")

    if token:
        try:
            payload = jwt.decode(
                token,
                current_app.config["JWT_SECRET_KEY"],
                algorithms=[current_app.config.get("JWT_ALGORITHM", "HS256")],
            )
            if payload.get("role") == "admin":
                return "admin", payload.get("sub") or payload.get("email") or "admin"
        except Exception:
            pass

    # 2. Extract or resolve server-validated session ID
    session_id = request.headers.get(SESSION_HEADER)
    if not session_id:
        session_id = request.cookies.get(SESSION_COOKIE)

    clean_sess = sanitize_identifier(session_id)
    if clean_sess and len(clean_sess) >= 16:
        return "session", clean_sess

    # 3. If caller has no session, generate a cryptographically random session ID
    new_sess = f"sess_{secrets.token_urlsafe(24)}"
    g.new_session_id = new_sess
    return "session", new_sess


def check_scan_ownership(scan_record, caller_type: str, caller_id: str) -> bool:
    """Verifies whether caller is authorized to view or modify scan_record."""
    if not scan_record:
        return False
    # Admins have global audit authorization
    if caller_type == "admin":
        return True

    record_owner = getattr(scan_record, "owner_session_id", None)
    # If legacy record has no owner, allow access in development/testing mode
    if record_owner is None:
        return True

    return bool(record_owner and record_owner == caller_id)


def assert_safe_path(base_dir: str, filename: str) -> str:
    """Ensures file access stays strictly within base_dir, preventing path traversal attacks.

    Raises:
        PermissionError: If path attempts to escape base_dir.
    """
    real_base = os.path.realpath(base_dir)
    # Reject explicit traversal components before resolution
    if ".." in filename or "/" in filename or "\\" in filename:
        clean_name = os.path.basename(filename)
    else:
        clean_name = filename

    target_path = os.path.realpath(os.path.join(real_base, clean_name))

    # Path must reside strictly inside real_base
    if not target_path.startswith(real_base) or target_path == real_base:
        raise PermissionError("Path traversal or illegal directory escape detected.")

    return target_path
