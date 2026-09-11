"""DocShield AI — Analyze API Endpoint.

Receives document image uploads, validates through the strict security pipeline,
and runs forensic analysis layers in parallel.
"""

from datetime import datetime, timezone
import io
import os
from flask import Blueprint, request, jsonify, current_app, g

from app.security.file_validation import (
    validate_and_reencode_image,
    FileValidationError,
)
from app.security.sanitization import generate_safe_storage_name
from app.schemas.analyze_schema import AnalyzeResponse
from app.layers.aggregator import execute_parallel_analysis
from app.extensions import limiter

analyze_bp = Blueprint("analyze", __name__)


@analyze_bp.route("/analyze", methods=["POST"])
@limiter.limit(lambda: current_app.config.get("RATELIMIT_ANALYZE", "20/minute"))
def analyze_document():
    """POST /api/v1/analyze — Analyze identity document for forgery and fraud.

    Accepts: multipart/form-data with 'image' or 'file' parameter.
    Returns: JSON AnalyzeResponse structure.
    """
    # Verify multipart content type
    content_type = request.headers.get("Content-Type", "")
    if not content_type.startswith("multipart/form-data"):
        return jsonify({
            "error": "Unsupported Media Type",
            "message": "Uploads must be submitted as 'multipart/form-data'.",
            "request_id": getattr(g, "request_id", None),
        }), 415

    # Retrieve uploaded file
    file_obj = request.files.get("image") or request.files.get("file")
    if not file_obj or not file_obj.filename:
        return jsonify({
            "error": "Bad Request",
            "message": "Missing document image file. Provide 'image' or 'file' in form-data.",
            "request_id": getattr(g, "request_id", None),
        }), 400

    # Execute File Upload Security Pipeline
    try:
        raw_bytes = file_obj.read()
        raw_stream = io.BytesIO(raw_bytes)

        max_dimension = current_app.config.get("MAX_IMAGE_DIMENSION", 8000)
        max_size = current_app.config.get("MAX_CONTENT_LENGTH", 10 * 1024 * 1024)

        clean_pil_img, clean_bytes, verified_format = validate_and_reencode_image(
            raw_stream=raw_stream,
            max_dimension=max_dimension,
            max_size_bytes=max_size,
        )

        # Store clean re-encoded image with a non-guessable UUID4 filename
        safe_filename = generate_safe_storage_name(file_obj.filename)
        upload_path = os.path.join(current_app.config["UPLOAD_FOLDER"], safe_filename)
        with open(upload_path, "wb") as f:
            f.write(clean_bytes)

    except FileValidationError as e:
        current_app.logger.warning("Security validation failed for upload: %s", str(e))
        return jsonify({
            "error": "Validation Error",
            "message": str(e),
            "request_id": getattr(g, "request_id", None),
        }), 400
    except Exception as e:
        current_app.logger.exception("Unexpected error during file sanitization: %s", str(e))
        return jsonify({
            "error": "Internal Server Error",
            "message": "Failed to process uploaded file safely.",
            "request_id": getattr(g, "request_id", None),
        }), 500

    # Execute 4-Layer Parallel Analysis Engine
    tesseract_cmd = current_app.config.get("TESSERACT_CMD", "")
    weights_path = current_app.config.get("MODEL_WEIGHTS_PATH", "")

    aggregated = execute_parallel_analysis(
        image=clean_pil_img,
        headers=dict(request.headers),
        form_data=dict(request.form),
        tesseract_cmd=tesseract_cmd,
        model_weights_path=weights_path,
        timeout_seconds=25.0,
    )

    now_iso = datetime.now(timezone.utc).isoformat()
    req_id = getattr(g, "request_id", None) or f"req-{int(datetime.now().timestamp() * 1000)}"

    # Generate quick thumbnail for history card rendering
    thumbnail_b64 = None
    try:
        import base64
        thumb = clean_pil_img.copy()
        thumb.thumbnail((260, 260))
        t_buf = io.BytesIO()
        thumb.save(t_buf, format="JPEG", quality=75)
        thumbnail_b64 = f"data:image/jpeg;base64,{base64.b64encode(t_buf.getvalue()).decode('utf-8')}"
    except Exception:
        pass

    # Persist to SQLite ScanResult database
    scan_id_str = f"SCAN-{int(datetime.now().timestamp()) % 100000:04d}"
    try:
        import json
        from app.models.scan import ScanResult
        from app.extensions import db

        doc_type = "unknown"
        l2_ocr = aggregated["layer_results"].get("layer2", {})
        if isinstance(l2_ocr, dict):
            doc_type = l2_ocr.get("document_type") or "unknown"

        scan_record = ScanResult(
            request_id=req_id,
            filename=file_obj.filename or "uploaded_document.jpg",
            verdict=aggregated["verdict"],
            confidence=aggregated["confidence"],
            document_type=doc_type,
            reason_tags=json.dumps(aggregated["reason_tags"]),
            heatmap_base64=aggregated["heatmap_base64"],
            thumbnail_base64=thumbnail_b64,
            layer_results=json.dumps(aggregated["layer_results"]),
            analysis_time_ms=aggregated["analysis_time_ms"],
            created_at=datetime.now(timezone.utc),
        )
        db.session.add(scan_record)
        db.session.commit()
        scan_id_str = f"SCAN-{scan_record.id:04d}"
    except Exception as e:
        current_app.logger.warning("Database write for scan skipped: %s", str(e))

    # Clean up temporary uploaded file
    try:
        if os.path.exists(upload_path):
            os.remove(upload_path)
    except OSError:
        pass

    # Build response dictionary matching the prompt specifications
    res_dict = {
        "id": scan_id_str,
        "request_id": req_id,
        "verdict": aggregated["verdict"],
        "confidence": aggregated["confidence"],
        "reason_tags": aggregated["reason_tags"],
        "heatmap": aggregated["heatmap"],
        "heatmap_base64": aggregated["heatmap_base64"],
        "thumbnail_base64": thumbnail_b64,
        "layer_results": aggregated["layer_results"],
        "processing_time_ms": aggregated["processing_time_ms"],
        "analysis_time_ms": aggregated["analysis_time_ms"],
        "timestamp": now_iso,
    }

    return jsonify(res_dict), 200

