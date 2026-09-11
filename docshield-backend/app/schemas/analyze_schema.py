"""DocShield AI — Analyze Schemas & Data Contracts.

Pydantic v2 schemas defining input validation and strict output response serialization
for document forgery detection analysis.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class BehavioralSignalDetails(BaseModel):
    is_emulator: bool = False
    is_virtual_camera: bool = False
    is_injection_attack: bool = False
    timestamp_skew_seconds: float = 0.0
    client_entropy_score: float = Field(default=100.0, ge=0.0, le=100.0)
    flags: List[str] = Field(default_factory=list)


class Layer1BehavioralResult(BaseModel):
    status: str = Field(description="'passed' | 'flagged' | 'inconclusive'")
    confidence: float = Field(ge=0.0, le=100.0)
    details: BehavioralSignalDetails = Field(default_factory=BehavioralSignalDetails)


class ExtractedDocumentFields(BaseModel):
    document_type: str = "unknown"
    document_number: Optional[str] = None
    holder_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    father_name: Optional[str] = None
    expiry_date: Optional[str] = None
    raw_text_snippet: Optional[str] = None
    raw_lines: List[str] = Field(default_factory=list)


class Layer2OCRResult(BaseModel):
    status: str = Field(description="'passed' | 'flagged' | 'inconclusive'")
    confidence: float = Field(ge=0.0, le=100.0)
    document_type: str = "unknown"
    fields: ExtractedDocumentFields = Field(default_factory=ExtractedDocumentFields)
    mrz_detected: bool = False
    mrz_checksum_valid: Optional[bool] = None
    mrz_format: Optional[str] = None
    barcode_detected: bool = False
    cross_check_matches: bool = True
    anomalies: List[str] = Field(default_factory=list)


class Layer3ForensicsResult(BaseModel):
    status: str = Field(description="'passed' | 'flagged' | 'inconclusive'")
    confidence: float = Field(ge=0.0, le=100.0)
    ela_anomaly_score: float = Field(ge=0.0, le=100.0)
    copy_move_detected: bool = False
    copy_move_matches_count: int = 0
    frequency_anomaly_score: float = Field(ge=0.0, le=100.0)
    photo_splicing_detected: bool = False
    anomalies: List[str] = Field(default_factory=list)


class Layer4AIResult(BaseModel):
    status: str = Field(description="'passed' | 'flagged' | 'inconclusive'")
    confidence: float = Field(ge=0.0, le=100.0)
    model: str = "EfficientNet-B0"
    forgery_probability: float = Field(ge=0.0, le=100.0)
    genuine_probability: float = Field(ge=0.0, le=100.0)
    heatmap_generated: bool = False


class LayerResultsBundle(BaseModel):
    layer1_behavioral: Layer1BehavioralResult
    layer2_ocr: Layer2OCRResult
    layer3_forensics: Layer3ForensicsResult
    layer4_ai_detection: Layer4AIResult


class AnalyzeResponse(BaseModel):
    """Unified forensic verdict output format."""
    verdict: str = Field(description="'Genuine' | 'Fake' | 'Suspicious'")
    confidence: float = Field(ge=0.0, le=100.0)
    heatmap: Optional[str] = Field(
        default=None, description="Base64 PNG data URL of forensic anomaly heatmap overlay"
    )
    heatmap_base64: Optional[str] = Field(
        default=None, description="Base64 PNG data URL of forensic anomaly heatmap overlay"
    )
    reason_tags: List[str] = Field(
        default_factory=list, description="Human-readable plain language evidence tags"
    )
    layer_results: Any
    analysis_time_ms: float = Field(default=0.0, ge=0.0)
    processing_time_ms: float = Field(default=0.0, ge=0.0)
    request_id: str = "local-scan"
    timestamp: str = ""

