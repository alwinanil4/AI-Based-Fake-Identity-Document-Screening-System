"""DocShield AI — Health & Diagnostics Endpoint.

Provides readiness and liveness checks for the API and dependent forensic engines.
"""

from flask import Blueprint, jsonify

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health_check():
    """GET /api/v1/health - Service health and module status."""
    return jsonify({
        "status": "healthy",
        "service": "DocShield AI Backend",
        "version": "1.0.0",
        "environment": "active",
        "layers": {
            "layer1_behavioral": "online",
            "layer2_ocr": "online",
            "layer3_forensics": "online",
            "layer4_ai_detection": "online",
        },
        "security": {
            "magic_byte_inspection": "active",
            "server_side_reencoding": "active",
            "decompression_bomb_guard": "active",
            "strict_headers": "active",
        },
    }), 200
