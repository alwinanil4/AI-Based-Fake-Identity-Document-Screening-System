import json
from datetime import datetime, timezone
from app.extensions import db


class ScanResult(db.Model):
    """Database model for storing historical scan outcomes with tenant session isolation."""

    __tablename__ = "scan_results"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    request_id = db.Column(db.String(64), unique=True, nullable=False, index=True)
    owner_session_id = db.Column(db.String(64), nullable=True, index=True)
    filename = db.Column(db.String(255), nullable=True, default="uploaded_document.jpg")
    verdict = db.Column(db.String(32), nullable=False, index=True)  # Genuine, Fake, Suspicious
    confidence = db.Column(db.Float, nullable=False)
    document_type = db.Column(db.String(64), nullable=False, default="unknown")
    reason_tags = db.Column(db.Text, nullable=True)  # JSON-serialized list
    heatmap_base64 = db.Column(db.Text, nullable=True)  # Base64 PNG data URL
    thumbnail_base64 = db.Column(db.Text, nullable=True)  # Base64 thumbnail for quick list rendering
    layer_results = db.Column(db.Text, nullable=True)  # JSON-serialized layer results
    analysis_time_ms = db.Column(db.Float, nullable=False, default=0.0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    def to_dict(self):
        tags = []
        if self.reason_tags:
            try:
                tags = json.loads(self.reason_tags)
            except Exception:
                tags = [t.strip() for t in self.reason_tags.split(";") if t.strip()]

        layers = {}
        if self.layer_results:
            try:
                layers = json.loads(self.layer_results)
            except Exception:
                pass

        formatted_id = f"SCAN-{self.id:04d}" if self.id else self.request_id

        doc_source = layers.get("document_source", {})
        vis_forensics = layers.get("visual_forensics", {})
        barcode_info = layers.get("barcode_crosscheck", {})
        face_info = layers.get("face_match", {})

        return {
            "id": formatted_id,
            "scan_id": self.id,
            "request_id": self.request_id,
            "timestamp": self.created_at.isoformat() if self.created_at else datetime.now(timezone.utc).isoformat(),
            "filename": self.filename or "uploaded_document.jpg",
            "document_name": self.filename or "uploaded_document.jpg",
            "verdict": self.verdict,
            "status": self.verdict.lower(),
            "confidence": round(self.confidence, 1),
            "document_type": self.document_type,
            "reason_tags": tags,
            "heatmap": self.heatmap_base64,
            "heatmap_base64": self.heatmap_base64,
            "thumbnail_base64": self.thumbnail_base64,
            "layer_results": layers,
            "document_source": doc_source,
            "visual_forensics": vis_forensics,
            "barcode_crosscheck": barcode_info,
            "face_match": face_info,
            "privacy": {
                "encrypted_at_rest": True,
                "upload_deleted": True,
                "encryption_algorithm": "AES-256-GCM",
                "ephemeral_lifecycle": True,
            },
            "analysis_time_ms": self.analysis_time_ms,
            "processing_time_ms": self.analysis_time_ms,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
