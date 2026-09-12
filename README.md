# DocShield AI — Production-Grade Identity Document Screening & Multi-Layer Verification System

**Multi-Layer AI & Cryptographic System for Detecting Fake and Forged Identity Documents**  
**Smart India Hackathon 2026** — Problem Statement **SIH26188**  
**Team InnovX** — Karunya Institute of Technology and Sciences, Coimbatore

---

## 🛡️ One-Line Project Pitch

> **"DocShield AI doesn't just read an identity document — it analyzes its source, content, visual structure, encoded data, forensic consistency, and optional identity consistency while minimizing the user's privacy exposure."**

---

## 📌 Core Product Philosophy

DocShield AI rejects naive binary classification that outputs ungrounded percentages like "Fake: 87%". Instead, it answers:  
**"What concrete evidence suggests that this document is consistent, inconsistent, or suspicious?"**

- **OCR** tells us *what* the document says.
- **Document Source Verification** tells us *how* the document appears to have been produced.
- **Visual Forensics** tells us *whether* the document looks internally consistent.
- **QR/Barcode Cross-Check** tells us *whether* encoded data agrees with visible data.
- **Face Matching** tells us *whether* user-supplied identities are visually consistent across documents.
- **Security Controls** protect the document throughout the entire lifecycle.

> ⚠️ **Strict Non-Negotiable Rule:** Zero fake functionality, zero fabricated confidence values, zero decorative forensic heatmaps, and zero unsubstantiated government claims. Every badge and metric originates from an actual implemented algorithmic calculation.

---

## 🏛️ System Architecture & Multi-Layer Verification

DocShield AI executes parallel forensic and cryptographic layers within an isolated thread pool, ensuring total processing time remains under 10 seconds:

```
                                  USER UPLOAD
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        │ 1. PRIVACY & SECURITY GATEWAY (AES-256-GCM Ephemeral Vault)  │
        └──────────────────────────────┬──────────────────────────────┘
                                       │ (Decrypted strictly in-memory)
    ┌──────────────────────────────────┼──────────────────────────────────┐
    ▼                                  ▼                                  ▼
[LAYER 1: BEHAVIORAL]         [LAYER 2: OCR & MRZ]         [LAYER 3: IMAGE FORENSICS]
• Bot/Emulator detection      • EasyOCR/Tesseract engines  • Error Level Analysis (ELA)
• Injection attack checks     • ICAO Doc 9303 checksums    • Copy-Move ORB keypoints
• Client entropy validation   • Document classification    • FFT/DCT high-freq analysis
    │                                  │                                  │
    ▼                                  ▼                                  ▼
[LAYER 4: DEEP LEARNING]      [DOCUMENT SOURCE VERIFIER]   [BARCODE/QR CROSS-CHECK]
• EfficientNet-B0 detector    • PDF object tree/AcroForms  • Multi-pass pyzbar + CLAHE
• Real trained model weights  • Signature dictionary check • Aadhaar/PAN field parser
• Grad-CAM anomaly heatmaps   • EXIF camera metadata tags  • High-confidence mismatch
    │                                  │                                  │
    └──────────────────────────────────┼──────────────────────────────────┘
                                       │
                    [CROSS-DOCUMENT BIOMETRIC FACE MATCHER]
                    • Optional secondary selfie/ID comparison
                    • Spatial gradient & texture descriptors
                    • 100% offline, privacy-first execution
                                       │
                                       ▼
                       [EXPLAINABLE RISK AGGREGATOR]
                       • Deterministic vetoes & evidence tags
                       • Honest Status Badges (UNKNOWN ≠ FAIL)
                       • Guaranteed Ephemeral Disk Deletion
```

---

## 🔒 Security & Privacy Architecture

### 1. Ephemeral Upload Lifecycle
- **Upload** → Validate MIME/magic bytes → Encrypt via AES-256-GCM → Decrypt in memory → Analyze → Return JSON → Delete encrypted file.
- **Guaranteed Cleanup**: Encrypted temporary files are cleaned via `try ... finally` blocks regardless of whether analysis succeeds, fails, or throws an exception. Plaintext documents are **never** written to persistent storage.
- **Demo Mode**: Controlled via `RETAIN_UPLOADS_FOR_DEMO=false` (default is strictly `false`).

### 2. AES-256-GCM Authenticated Encryption
- Implemented in `app/security/encryption.py` using standard cryptography primitives.
- Generates a cryptographically secure 96-bit random nonce (`os.urandom(12)`) per encryption operation.
- Validates a 128-bit authentication tag to detect any ciphertext tampering.
- Strictly validates 256-bit entropy of `DOCSHIELD_AES_KEY` from environment variables.

### 3. Server-Side IDOR & Authorization Protection
- Implemented in `app/security/session_auth.py`.
- Rejects client-supplied tenant IDs. Requests are bound server-side to cryptographically random session tokens (`X-Session-ID` header or `docshield_session` HTTP-only cookie).
- Accessing another user's scan record returns **HTTP 403 Forbidden** with zero metadata leakage.
- Enforces strict path traversal defenses rejecting `..`, absolute paths, and null bytes.

---

## 🔬 Advanced Verification Layers

### Layer: Document Source Verification
- **PDF Structure Analysis**: Inspects PDF object dictionaries, Creator/Producer headers, incremental updates, AcroForms, and digital signature dictionaries (`/Sig`, `/ByteRange`).
- **Image Metadata Analysis**: Evaluates EXIF tags (`Make`, `Model`, `Software`) and checks for typical screen capture dimensions (e.g. 1920x1080, 2560x1440).
- **Status Codes**: `ORIGINAL-LIKE STRUCTURE`, `POSSIBLE SCAN/SCREENSHOT`, `STRUCTURAL ANOMALY`, `UNABLE TO DETERMINE`, `NOT APPLICABLE`.

### Layer: Visual Forensics & Layout Consistency
- **Text Spacing**: Evaluates inter-word and inter-character spacing variance across detected bounding boxes.
- **Baseline Alignment**: Computes vertical baseline deviation across neighboring text lines.
- **Font Stroke Consistency**: Measures median stroke thickness variance across text fields.
- **Photo Region Integrity**: Calculates localized noise and Error Level Analysis (ELA) ratios between the photo region and the document canvas.

### Layer: Barcode & QR Code Forensic Cross-Check
- **Multi-Engine Decoding**: Employs `pyzbar` with contrast-limited adaptive histogram equalization (CLAHE) and grayscale fallbacks.
- **Field-Aware Payload Parsing**: Extracts structured fields from Indian identity QR payloads (Aadhaar XML, Secure QR, and PAN formats).
- **Cross-Verification**: Compares normalized numbers against OCR-extracted text. Identifies high-confidence mismatches without penalizing documents that legitimately do not feature barcodes.

### Layer: Cross-Document Biometric Face Matching (Optional)
- Accepts an optional secondary document or selfie (`secondary_image` in form-data).
- Employs Haar cascade detection and spatial multi-cell texture/gradient descriptors.
- Evaluates cosine similarity against empirical thresholds (`>= 0.78` for match).
- Returns honest statuses: `SAME`, `DIFFERENT`, `NO FACE`, `MULTIPLE FACES`, `LOW QUALITY`, `NOT PERFORMED`.

---

## ⚖️ Explicit Verification Limitations & Disclaimers

Judges and technical evaluators should note the following explicit engineering disclosures:

1. **Document Source Verification is NOT DigiLocker Authentication**:  
   *DocShield AI inspects internal structural PDF object tables and metadata characteristics. It does NOT claim official DigiLocker authentication or sovereign Certifying Authority (CA) validation unless an authorized, legally licensed DigiLocker gateway API is explicitly configured.*
2. **Face Matching is User-Supplied Comparison**:  
   *The biometric face matcher compares user-supplied images only. It does NOT perform government database queries (such as UIDAI Aadhaar face authentication) or legal identity attestation.*
3. **Forensic Anomalies are Signals, Not Absolute Proof**:  
   *Visual anomalies (such as text spacing variance or metadata absence) are indicators of potential editing, but can also result from legitimate camera compression, scanner re-encoding, or messaging app downsampling. Unknown or missing signals are never treated as proof of forgery (`UNKNOWN ≠ FAIL`).*

---

## 🧪 Automated Test Suite (63 Tests, 100% Passed)

The test suite covers unit, integration, and security penetration test cases:

```bash
cd docshield-backend
.\.venv\Scripts\pytest -v
```

### Breakdown of Test Results:
- **`tests/test_advanced_verification.py` (16 Tests)**: AES-256-GCM encryption, tamper rejection, key entropy, ephemeral file deletion on success & failure, session IDOR isolation, path traversal, screenshot detection, EXIF extraction, QR/OCR mismatch detection, missing barcode neutrality, and face matching.
- **`tests/test_analyze.py` (4 Tests)**: Upload endpoint validation, multipart handling, empty payload rejection, and fake extension prevention.
- **`tests/test_auth.py` (8 Tests)**: Admin authentication, password hashing, account lockout, JWT tamper resistance, and RBAC authorization.
- **`tests/test_file_validation.py` (8 Tests)**: Magic bytes validation, decompression bomb prevention, SVG script injection defense, and format normalization.
- **`tests/test_security.py` (8 Tests)**: Adversarial attacks, rate limiting, exception leakage prevention, and directory traversal.
- **`tests/test_layers*.py` (19 Tests)**: Behavioral heuristics, ICAO TD3 MRZ check digits, ELA, copy-move ORB matching, FFT frequency analysis, and neural network inference.

---

## 🚀 Quick Start & Judge Demonstration

### 1. Start the Backend API Server
```bash
cd docshield-backend
# Activate virtual environment
.\.venv\Scripts\activate
# Start Flask server
python run.py
```
*Backend runs at `http://localhost:5000` with SQLite auto-migration and AES encryption.*

### 2. Start the Frontend React Client
```bash
# In repository root
npm install
npm run dev
```
*Frontend runs at `http://localhost:5173`.*

---

## 📋 Judge Demonstration Matrix (7 Key Scenarios)

| Scenario | Test Document | Expected Result | What the System Proves vs Cannot Prove |
| :--- | :--- | :--- | :--- |
| **Case 1: Normal Genuine Document** | `sample_genuine_passport.png` | **Genuine** (PASS across all layers) | Proves valid ICAO MRZ checksums and structural integrity; cannot prove passport is not reported lost/stolen. |
| **Case 2: Altered Text Spacing/Alignment** | Preset / Altered Text Sample | **Suspicious** (Visual Forensics: Flagged) | Proves baseline offset and stroke width inconsistency; cannot prove intent of editor. |
| **Case 3: ID Number Tampered with Original QR** | Tampered Aadhaar with QR | **Suspicious / Fake** (QR Cross-Check: MISMATCH) | Proves visible OCR number differs from cryptographic barcode payload; strong proof of field splicing. |
| **Case 4: Inconsistent Photo Region** | `sample_spliced_voter_id.jpg` | **Fake** (Forensics: High ELA / Noise Ratio) | Proves photo region has distinct compression and sharp boundary artifacts compared to canvas. |
| **Case 5: Screenshot Document** | Mobile screenshot of ID | **Document Source: POSSIBLE SCREENSHOT** | Proves screen aspect ratio and missing camera EXIF; does not penalize score as forgery. |
| **Case 6: Matching Faces (Cross-Doc)** | Document A + Document B (Same Person) | **Face Match: SAME** (Similarity >= 0.78) | Proves both documents depict the same individual; does not attest to government identity validity. |
| **Case 7: Different Faces (Cross-Doc)** | Document A + Document B (Different Person) | **Face Match: DIFFERENT** (Similarity < 0.78) | Proves the two submitted documents belong to distinct individuals. |

---

## 👥 Team InnovX
- Karunya Institute of Technology and Sciences, Coimbatore
- Smart India Hackathon 2026 — Problem Statement SIH26188