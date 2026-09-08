"""DocShield AI — Authentication Routes.

Implements secure administrator login, JWT token issuance, token rotation/refresh,
and httpOnly cookie management.
"""

from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify, current_app, make_response, g
import jwt
from pydantic import BaseModel, EmailStr, ValidationError

from app.extensions import db, limiter
from app.auth.models import AdminUser

auth_bp = Blueprint("auth", __name__)


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


def generate_jwt_tokens(user: AdminUser) -> dict:
    """Creates a short-lived access token and a long-lived refresh token."""
    now = datetime.now(timezone.utc)
    access_expiry = now + current_app.config["JWT_ACCESS_TOKEN_EXPIRES"]
    refresh_expiry = now + current_app.config["JWT_REFRESH_TOKEN_EXPIRES"]

    secret = current_app.config["JWT_SECRET_KEY"]
    alg = current_app.config.get("JWT_ALGORITHM", "HS256")

    access_payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "token_type": "access",
        "iat": now,
        "exp": access_expiry,
    }

    refresh_payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "token_type": "refresh",
        "iat": now,
        "exp": refresh_expiry,
    }

    access_token = jwt.encode(access_payload, secret, algorithm=alg)
    refresh_token = jwt.encode(refresh_payload, secret, algorithm=alg)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "access_expires_in": int(current_app.config["JWT_ACCESS_TOKEN_EXPIRES"].total_seconds()),
    }


@auth_bp.route("/login", methods=["POST"])
@limiter.limit(lambda: current_app.config.get("RATELIMIT_LOGIN", "5/15minute"))
def login():
    """POST /api/v1/auth/login — Authenticate admin credentials and issue JWTs."""
    if not request.is_json:
        return jsonify({
            "error": "Bad Request",
            "message": "Content-Type must be 'application/json'.",
            "request_id": getattr(g, "request_id", None),
        }), 400

    try:
        data = LoginSchema(**request.get_json())
    except ValidationError as err:
        return jsonify({
            "error": "Validation Error",
            "message": "Invalid login parameters.",
            "details": err.errors(),
            "request_id": getattr(g, "request_id", None),
        }), 400

    user = AdminUser.query.filter_by(email=data.email.lower().strip()).first()

    if not user:
        return jsonify({
            "error": "Unauthorized",
            "message": "Invalid email or password.",
            "request_id": getattr(g, "request_id", None),
        }), 401

    if user.is_locked():
        return jsonify({
            "error": "Too Many Requests",
            "message": "Account temporarily locked due to excessive failed attempts. Try again later.",
            "request_id": getattr(g, "request_id", None),
        }), 429

    if not user.check_password(data.password):
        user.register_failed_attempt()
        db.session.commit()
        return jsonify({
            "error": "Unauthorized",
            "message": "Invalid email or password.",
            "request_id": getattr(g, "request_id", None),
        }), 401

    # Authentication successful
    user.reset_failed_attempts()
    db.session.commit()

    tokens = generate_jwt_tokens(user)
    is_prod = not current_app.config.get("DEBUG", False) and not current_app.config.get("TESTING", False)

    response = make_response(jsonify({
        "message": "Authentication successful",
        "access_token": tokens["access_token"],
        "expires_in": tokens["access_expires_in"],
        "user": {"id": user.id, "email": user.email, "role": user.role},
        "request_id": getattr(g, "request_id", None),
    }), 200)

    # Secure httpOnly Cookie Storage for Defense in Depth against XSS
    response.set_cookie(
        "refresh_token",
        tokens["refresh_token"],
        httponly=True,
        secure=is_prod,
        samesite="Lax",
        max_age=int(current_app.config["JWT_REFRESH_TOKEN_EXPIRES"].total_seconds()),
        path="/api/v1/auth",
    )

    response.set_cookie(
        "access_token",
        tokens["access_token"],
        httponly=True,
        secure=is_prod,
        samesite="Lax",
        max_age=tokens["access_expires_in"],
        path="/api/v1",
    )

    return response


@auth_bp.route("/refresh", methods=["POST"])
def refresh():
    """POST /api/v1/auth/refresh — Rotate access token using valid refresh token."""
    token = request.cookies.get("refresh_token")
    if not token and request.is_json:
        token = request.get_json().get("refresh_token")

    if not token:
        return jsonify({
            "error": "Unauthorized",
            "message": "Missing refresh token.",
            "request_id": getattr(g, "request_id", None),
        }), 401

    try:
        payload = jwt.decode(
            token,
            current_app.config["JWT_SECRET_KEY"],
            algorithms=[current_app.config.get("JWT_ALGORITHM", "HS256")],
        )
    except jwt.ExpiredSignatureError:
        return jsonify({
            "error": "Unauthorized",
            "message": "Refresh token expired. Please log in again.",
            "request_id": getattr(g, "request_id", None),
        }), 401
    except jwt.InvalidTokenError:
        return jsonify({
            "error": "Unauthorized",
            "message": "Invalid refresh token.",
            "request_id": getattr(g, "request_id", None),
        }), 401

    if payload.get("token_type") != "refresh":
        return jsonify({
            "error": "Unauthorized",
            "message": "Supplied token is not a refresh token.",
            "request_id": getattr(g, "request_id", None),
        }), 401

    user_id = payload.get("sub")
    user = db.session.get(AdminUser, int(user_id)) if user_id else None
    if not user:
        return jsonify({
            "error": "Unauthorized",
            "message": "User associated with token no longer exists.",
            "request_id": getattr(g, "request_id", None),
        }), 401

    tokens = generate_jwt_tokens(user)
    is_prod = not current_app.config.get("DEBUG", False) and not current_app.config.get("TESTING", False)

    response = make_response(jsonify({
        "message": "Token refreshed successfully",
        "access_token": tokens["access_token"],
        "expires_in": tokens["access_expires_in"],
        "request_id": getattr(g, "request_id", None),
    }), 200)

    response.set_cookie(
        "access_token",
        tokens["access_token"],
        httponly=True,
        secure=is_prod,
        samesite="Lax",
        max_age=tokens["access_expires_in"],
        path="/api/v1",
    )

    return response


@auth_bp.route("/logout", methods=["POST"])
def logout():
    """POST /api/v1/auth/logout — Invalidate cookie tokens."""
    response = make_response(jsonify({
        "message": "Logged out successfully",
        "request_id": getattr(g, "request_id", None),
    }), 200)

    response.delete_cookie("access_token", path="/api/v1")
    response.delete_cookie("refresh_token", path="/api/v1/auth")
    return response
