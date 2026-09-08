"""DocShield AI — Structured Logging Configuration.

Configures application-wide logging with request ID tracking, ISO timestamps,
and sanitized error reporting.
"""

import logging
import uuid
from flask import g, request, has_request_context


class RequestIDFilter(logging.Filter):
    """Injects current request ID or generates a default context identifier into logs."""

    def filter(self, record):
        if has_request_context():
            record.request_id = getattr(g, "request_id", "no-request-id")
            record.client_ip = request.remote_addr or "unknown"
            record.endpoint = request.path
        else:
            record.request_id = "system"
            record.client_ip = "127.0.0.1"
            record.endpoint = "internal"
        return True


def setup_logging(app):
    """Configures structured logging on the Flask app and root logger."""
    log_level = logging.DEBUG if app.config.get("DEBUG") else logging.INFO

    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [req:%(request_id)s] [%(name)s]: %(message)s"
    )

    handler = logging.StreamHandler()
    handler.setLevel(log_level)
    handler.setFormatter(formatter)
    handler.addFilter(RequestIDFilter())

    # Replace default handlers to prevent duplicate output
    app.logger.handlers.clear()
    app.logger.addHandler(handler)
    app.logger.setLevel(log_level)

    # Attach request ID to Flask global context before each request
    @app.before_request
    def set_request_id():
        # Allow client to pass existing X-Request-ID, or generate new UUID4
        client_req_id = request.headers.get("X-Request-ID")
        g.request_id = client_req_id if client_req_id else str(uuid.uuid4())

    @app.after_request
    def attach_request_id_to_response(response):
        if hasattr(g, "request_id"):
            response.headers["X-Request-ID"] = g.request_id
        return response
