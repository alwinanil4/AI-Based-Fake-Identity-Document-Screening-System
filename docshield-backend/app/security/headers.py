"""DocShield AI — Security Headers Middleware.

Injects enterprise-grade security headers on every HTTP response, guarding against
clickjacking, MIME-sniffing, XSS, and unauthorized framing.
"""

from flask import current_app


def init_security_headers(app):
    """Registers security headers on the Flask application after_request hook."""

    @app.after_request
    def set_security_headers(response):
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Prevent framing / clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # Cross-Site Scripting protection for legacy browsers
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Referrer Policy to prevent information leakage
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Permissions Policy disabling risky browser features
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=()"
        )

        # Content Security Policy (strict default for JSON API)
        response.headers["Content-Security-Policy"] = (
            "default-src 'none'; frame-ancestors 'none'; base-uri 'none';"
        )

        # Strict-Transport-Security (HSTS) in production or HTTPS
        if not app.config.get("DEBUG") and not app.config.get("TESTING"):
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        # Cache control for sensitive API responses
        if "Cache-Control" not in response.headers:
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
            response.headers["Pragma"] = "no-cache"

        return response
