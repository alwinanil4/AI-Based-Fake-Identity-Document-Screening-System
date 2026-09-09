"""DocShield AI — Scan Result Database Model.

Persists document analysis metadata and verdicts for admin auditing and dashboard analytics.
"""

from datetime import datetime, timezone
from app.extensions import db


class ScanResult(db.Model):
    """Database model for storing historical scan outcomes."""

    __tablename__ = "scan_results"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    request_id = db.Column(db.String(64), unique=True, nullable=False, index=True)
    verdict = db.Column(db.String(32), nullable=False, index=True)  # genuine, fake, suspicious
    confidence = db.Column(db.Float, nullable=False)
    document_type = db.Column(db.String(64), nullable=False, default="unknown")
    reason_tags = db.Column(db.Text, nullable=True)
    analysis_time_ms = db.Column(db.Float, nullable=False, default=0.0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "request_id": self.request_id,
            "verdict": self.verdict,
            "confidence": self.confidence,
            "document_type": self.document_type,
            "reason_tags": [t.strip() for t in self.reason_tags.split(";")] if self.reason_tags else [],
            "analysis_time_ms": self.analysis_time_ms,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
