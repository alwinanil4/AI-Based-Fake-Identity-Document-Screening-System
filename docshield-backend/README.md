# DocShield AI — Backend Service

> **Multi-Layer Forensic Screening System for Detecting Fake and Forged Identity Documents**  
> Smart India Hackathon 2026 — Problem Statement SIH26188 | Team InnovX

---

## 1. Architectural Overview

DocShield AI analyzes identity documents (Passports, Aadhaar cards, Driving Licenses, PAN cards) across four independent analysis layers executed **concurrently** within a strict sub-10-second SLA. The outputs are fused by an explainable **Result Aggregator** that enforces deterministic mathematical vetos (e.g., ICAO check digit failures cannot be overruled by AI confidence).

```
                             [ Client / Frontend ]
                                       │
                      [ Security & Upload Sanitization ]
              (Magic-byte check, Pillow re-encode, Decomp-bomb guard)
                                       │
               ┌───────────────────────┴───────────────────────┐
               │         ThreadPoolExecutor (Parallel)          │
               ▼                       ▼                       ▼                       ▼
       [ Layer 1 ]             [ Layer 2 ]             [ Layer 3 ]             [ Layer 4 ]
       Behavioral &            OCR & Structural        Image Forensics         EfficientNet-B0
       Device Signals          Validation (MRZ/QR)     (ELA, Clone, FFT)       Deep Learning
               │                       │                       │                       │
               └───────────────────────┬───────────────────────┘
                                       ▼
                             [ Result Aggregator ]
            (Deterministic Veto, Reason Tags, Anomaly Heatmap Overlay)
                                       │
                             [ JSON Report API ]
                        + [ ScanResult Audit Record ]
```

---

## 2. Forensic Analysis Layers

| Layer | Engine | Primary Responsibilities |
|---|---|---|
| **Layer 1: Behavioral & Device Signals** | Telemetry & Entropy Analyzers | Flags headless emulators (Puppeteer, Selenium), virtual webcams (OBS-Camera), video-stream injection/replay attacks, and artificial flat sensor noise. |
| **Layer 2: OCR & Structural Validation** | Tesseract OCR + `pyzbar` + ICAO 9303 Parser | Extracts statutory identity fields, computes ICAO Doc 9303 recurring 7-3-1 check digits on TD1/TD3 MRZ formats, decodes QR/barcodes, and performs deterministic cross-checks. |
| **Layer 3: Image Forensics** | OpenCV + Pillow | Runs Error Level Analysis (ELA) to expose multi-source image splicing; ORB keypoint matching to detect copy-move cloning; and 2D Fast Fourier Transform (FFT) to catch periodic GAN/diffusion grid artifacts. |
| **Layer 4: AI Deep Learning** | PyTorch + Torchvision (EfficientNet-B0) | Runs forward inference with `weights_only=True` to compute forgery probabilities and extracts Class Activation Maps (CAM) highlighting suspicious pixels. |
| **Result Aggregator** | Concurrent Fusion Engine | Merges layer results, enforces **deterministic veto** on structural tampering, compiles plain-language reason tags, and generates base64 JET colormap heatmap overlays. |

---

## 3. Production Security Checklist Implemented

- **Magic-Byte Sniffing**: Inspects raw byte signatures before decoding (`image/jpeg`, `image/png`); blocks executables (ELF/EXE), SVGs, XML, and archives.
- **Server-Side Re-encoding**: Re-encodes every uploaded image via Pillow to safe RGB JPEG, completely neutralizing embedded malware, malformed headers, and steganographic payloads.
- **Decompression Bomb Defense**: Enforces a strict dimension ceiling (8,000 x 8,000 px) before full decompression in memory.
- **Strict Size Limits**: 10MB default hard body limit enforced at both web server and application layers.
- **Path Traversal Defense**: Rejects `../`, null bytes, and generates collision-free UUID4 storage filenames outside the web root.
- **Zero Information Leakage**: Error handlers log complete stack traces internally with request IDs (`X-Request-ID`), returning sanitized generic messages to clients.
- **Security Headers Middleware**: Injects `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, and restricted CORS.
- **Brute-Force & Rate Limiting**: `Flask-Limiter` protects endpoints (`20/min` on `/analyze`, `5/15min` on `/login`); automatic account lockout after 5 consecutive failures.
- **Role-Based JWT Authorization**: Protected admin routes require cryptographically signed access tokens with `role == 'admin'` and support secure `httpOnly` cookies.

---

## 4. Local Setup & Quickstart

### Prerequisites
- Python 3.12 (Recommended for PyTorch and OpenCV compatibility)
- Tesseract OCR (Optional for local OCR visual zone text extraction)

### Installation

```bash
# 1. Navigate to backend directory
cd docshield-backend

# 2. Create virtual environment
py -3.12 -m venv .venv

# 3. Activate virtual environment
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Linux/macOS:
source .venv/bin/activate

# 4. Install pinned dependencies
pip install -r requirements.txt

# 5. Initialize environment file
cp .env.example .env
```

### Running in Development

```bash
# Run using Flask dev server (port 5000)
python wsgi.py
# Or using flask CLI:
flask --app wsgi:app run --port 5000
```

### Running in Production

```bash
# Windows (using Waitress):
waitress-serve --listen=0.0.0.0:5000 wsgi:app

# Linux / Docker (using Gunicorn with 4 workers and 2 threads):
gunicorn --bind 0.0.0.0:5000 --workers 4 --threads 2 --timeout 60 wsgi:app
```

---

## 5. Docker Deployment

```bash
# Build production Docker image
docker build -t docshield-backend .

# Run container with unprivileged user on port 5000
docker run -d -p 5000:5000 --env-file .env --name docshield-api docshield-backend
```

---

## 6. API Reference & Examples

### Health Check
```bash
curl -X GET http://localhost:5000/api/v1/health
```

### Analyze Document (Multipart Upload)
```bash
curl -X POST http://localhost:5000/api/v1/analyze \
  -F "image=@/path/to/identity_card.jpg"
```

**Response Format (`200 OK`):**
```json
{
  "verdict": "genuine",
  "confidence": 96.0,
  "heatmap": "data:image/png;base64,iVBORw0KGgoAAA...",
  "reason_tags": [
    "All structural, forensic, and biometric security checks passed"
  ],
  "analysis_time_ms": 1420.5,
  "request_id": "c76f4e15-201a-4ab0-b490-b184288019a3",
  "timestamp": "2026-09-08T18:00:00.000000Z",
  "layer_results": {
    "layer1_behavioral": {
      "status": "passed",
      "confidence": 94.0,
      "details": {
        "is_emulator": false,
        "is_virtual_camera": false,
        "is_injection_attack": false,
        "timestamp_skew_seconds": 0.0,
        "client_entropy_score": 95.0,
        "flags": []
      }
    },
    "layer2_ocr": {
      "status": "passed",
      "confidence": 96.0,
      "document_type": "passport",
      "fields": {
        "document_type": "passport",
        "document_number": "L898902C3",
        "holder_name": "ANNA MARIA ERIKSSON",
        "date_of_birth": "740812",
        "expiry_date": "120415"
      },
      "mrz_detected": true,
      "mrz_checksum_valid": true,
      "mrz_format": "TD3",
      "barcode_detected": false,
      "cross_check_matches": true,
      "anomalies": []
    },
    "layer3_forensics": {
      "status": "passed",
      "confidence": 91.2,
      "ela_anomaly_score": 12.4,
      "copy_move_detected": false,
      "copy_move_matches_count": 0,
      "frequency_anomaly_score": 14.1,
      "photo_splicing_detected": false,
      "anomalies": []
    },
    "layer4_ai_detection": {
      "status": "passed",
      "confidence": 92.5,
      "model": "EfficientNet-B0",
      "forgery_probability": 7.5,
      "genuine_probability": 92.5,
      "heatmap_generated": true
    }
  }
}
```

### Admin Authentication
```bash
# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@docshield.local", "password": "DocShieldAdmin@2026!"}'

# Query Historical Scans (Bearer Token)
curl -X GET http://localhost:5000/api/v1/admin/scans \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

## 7. Running the Automated Test Suite

The test suite includes comprehensive unit tests and adversarial attack simulations:

```bash
# Run all 44 test cases
pytest

# Run attack simulation security tests specifically
pytest tests/test_security.py -v

# Run with test coverage report
pytest --cov=app tests/
```
