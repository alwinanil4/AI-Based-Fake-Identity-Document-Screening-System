"""DocShield AI — History and Scan Detail API Endpoints.

Provides public / demo endpoints for querying past scan audits and inspection details:
- GET /api/history: List past scans with thumbnail, verdict, confidence, timestamp.
- GET /api/scan/<id>: Full detail of a single scan (heatmap, layer breakdown, reasons).
"""

from flask import Blueprint, jsonify, request, g
from app.models.scan import ScanResult

history_bp = Blueprint("history", __name__)


@history_bp.route("/history", methods=["GET"])
def get_scan_history():
    """GET /api/history — Retrieve past scan records for demo and admin history view."""
    verdict_filter = request.args.get("verdict")
    limit = min(int(request.args.get("limit", 50)), 100)
    offset = max(int(request.args.get("offset", 0)), 0)

    query = ScanResult.query

    if verdict_filter and verdict_filter.lower() != "all":
        query = query.filter(ScanResult.verdict.ilike(verdict_filter.strip()))

    total_count = query.count()
    records = query.order_by(ScanResult.created_at.desc()).offset(offset).limit(limit).all()

    return jsonify({
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "scans": [r.to_dict() for r in records],
        "request_id": getattr(g, "request_id", None),
    }), 200


@history_bp.route("/scan/<scan_id>", methods=["GET"])
def get_scan_by_id(scan_id: str):
    """GET /api/scan/<id> — Retrieve complete forensic detail for a single scan."""
    record = None

    # Support 'SCAN-0004', numeric ID '4', or UUID 'req-...'
    if scan_id.upper().startswith("SCAN-"):
        try:
            num_id = int(scan_id.split("-")[1])
            record = ScanResult.query.filter_by(id=num_id).first()
        except Exception:
            pass

    if not record and scan_id.isdigit():
        record = ScanResult.query.filter_by(id=int(scan_id)).first()

    if not record:
        record = ScanResult.query.filter_by(request_id=scan_id).first()

    if not record:
        return jsonify({
            "error": "Not Found",
            "message": f"Scan with ID '{scan_id}' does not exist.",
            "request_id": getattr(g, "request_id", None),
        }), 404

    result = record.to_dict()
    result["scan"] = record.to_dict()
    result["request_id"] = getattr(g, "request_id", None)
    return jsonify(result), 200
