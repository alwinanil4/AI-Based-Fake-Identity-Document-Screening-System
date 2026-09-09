"""DocShield AI — Authenticated Admin Endpoints.

Provides administrative audit log access, scan history querying, and forensic metrics.
All routes strictly protected by @require_admin.
"""

from flask import Blueprint, jsonify, request, g
from app.auth.decorators import require_admin
from app.models.scan import ScanResult

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/scans", methods=["GET"])
@require_admin
def list_scans():
    """GET /api/v1/admin/scans — Retrieve historical scan results with optional filtering."""
    verdict_filter = request.args.get("verdict")
    limit = min(int(request.args.get("limit", 50)), 100)
    offset = max(int(request.args.get("offset", 0)), 0)

    query = ScanResult.query

    if verdict_filter:
        query = query.filter_by(verdict=verdict_filter.lower())

    total_count = query.count()
    records = query.order_by(ScanResult.created_at.desc()).offset(offset).limit(limit).all()

    return jsonify({
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "scans": [r.to_dict() for r in records],
        "request_id": getattr(g, "request_id", None),
    }), 200


@admin_bp.route("/scans/<request_id>", methods=["GET"])
@require_admin
def get_scan_detail(request_id: str):
    """GET /api/v1/admin/scans/<request_id> — Fetch specific scan result details."""
    record = ScanResult.query.filter_by(request_id=request_id).first()
    if not record:
        return jsonify({
            "error": "Not Found",
            "message": f"Scan with request ID '{request_id}' does not exist.",
            "request_id": getattr(g, "request_id", None),
        }), 404

    return jsonify({
        "scan": record.to_dict(),
        "request_id": getattr(g, "request_id", None),
    }), 200
