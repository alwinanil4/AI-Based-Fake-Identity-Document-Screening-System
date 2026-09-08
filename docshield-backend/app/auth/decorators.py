"""DocShield AI — Authentication & Authorization Decorators.

Enforces server-side JWT verification, role-based access control, and token claim integrity.
"""

from functools import wraps
from flask import request, jsonify, current_app, g
import jwt

from app.auth.models import AdminUser


def require_admin(f):
    """Decorator that verifies a valid, non-expired JWT access token and admin role."""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None

        # 1. Extract Bearer token from Authorization header
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()

        # 2. Or fallback to secure httpOnly cookie
        if not token:
            token = request.cookies.get("access_token")

        if not token:
            return jsonify({
                "error": "Unauthorized",
                "message": "Authentication required. Missing or empty access token.",
                "request_id": getattr(g, "request_id", None),
            }), 401

        # 3. Cryptographically verify signature and claims
        try:
            payload = jwt.decode(
                token,
                current_app.config["JWT_SECRET_KEY"],
                algorithms=[current_app.config.get("JWT_ALGORITHM", "HS256")],
            )
        except jwt.ExpiredSignatureError:
            return jsonify({
                "error": "Unauthorized",
                "message": "Token has expired. Please refresh your session.",
                "request_id": getattr(g, "request_id", None),
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                "error": "Unauthorized",
                "message": "Invalid or tampered access token signature.",
                "request_id": getattr(g, "request_id", None),
            }), 401

        # 4. Enforce Token Type Claim
        if payload.get("token_type") != "access":
            return jsonify({
                "error": "Unauthorized",
                "message": "Invalid token type for API access.",
                "request_id": getattr(g, "request_id", None),
            }), 401

        # 5. Enforce Admin Role Claim
        if payload.get("role") != "admin":
            return jsonify({
                "error": "Forbidden",
                "message": "Privileged admin role required for this resource.",
                "request_id": getattr(g, "request_id", None),
            }), 403

        # Attach claims to Flask global context
        g.current_user = payload
        return f(*args, **kwargs)

    return decorated_function
