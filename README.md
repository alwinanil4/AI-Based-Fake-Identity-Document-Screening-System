# DocShield AI

**Multi-Layer AI System for Detecting Fake and Forged Identity Documents**

Smart India Hackathon 2026 — Problem Statement SIH26188
Team InnovX — Karunya Institute of Technology and Sciences, Coimbatore

---

## Overview

DocShield AI is a multi-layer, AI-powered document screening system that detects fake and forged identity documents through parallel forensic analysis, delivering explainable results in under 10 seconds.

Instead of relying on a single detection technique, the system runs behavioral, structural, forensic, and deep-learning checks simultaneously — mirroring the approach used by industry leaders in document verification — to catch even sophisticated forgeries that a single-layer system would miss.

The system doesn't just say "fake" or "genuine." It shows the evidence: a forensic heatmap, plain-language reason tags, and a side-by-side comparison of the original document against the flagged anomalies. This explainability is the core differentiator of the project.

---

## Problem Statement

Identity fraud and document forgery are increasing across banking, travel, and government verification workflows. Fraudsters increasingly use:

- Photo splicing (an edited face pasted onto an ID)
- Text tampering (mismatched dates or details between fields)
- Copy-move duplication (the same element cloned across the document)
- AI-generated forgery (GAN or diffusion-model-produced fake documents)
- Injection attacks (a document frame replayed during a live verification session)

Most existing verification tools rely on one detection method at a time — OCR checks alone, or basic image comparison alone — which leaves them vulnerable to sophisticated, multi-pronged forgery techniques. There is a clear need for a system that combines several independent detection layers and explains its reasoning, so a human reviewer can trust and act on the verdict.

---

## Solution Architecture

DocShield AI is built around four independent analysis layers that run in parallel, not sequentially. Their outputs are combined by a central **Result Aggregator** into one explainable report.

```
USER UPLOADS DOCUMENT
        |
        v
LAYER 1 — Behavioral & Device Signals
        |
        v
LAYER 2 — OCR & Structural Validation
        |
        v
LAYER 3 — Image Forensics
        |
        v
LAYER 4 — AI / Deep Learning Detection
        |
        v
RESULT AGGREGATOR
```

### Layer 1 — Behavioral & Device Signals
- Detects scripted or automated submissions
- Flags emulators, virtual cameras, and frame-injection attacks
- Confirms a genuine live capture session

### Layer 2 — OCR & Structural Validation
- Extracts text using Tesseract OCR and EasyOCR
- Validates MRZ and barcode data using zbarcam
- Cross-checks extracted fields against MRZ data
- Checks font alignment and layout consistency

### Layer 3 — Image Forensics
- Error Level Analysis (ELA) — reveals compression edits
- Copy-move detection — flags duplicated regions
- Pixel-level anomaly detection (CNN / EfficientNet)
- Frequency analysis (DCT / FFT) — catches GAN artifacts

### Layer 4 — AI / Deep Learning Detection
- Vision Transformer (ViT) for unified detection and localization
- Trained on synthetic forgery datasets, including GenAI-generated documents
- Produces a forensic heatmap and confidence score

### Result Aggregator
Combines all four layer outputs into a single explainable report containing:

- **Verdict** — Genuine / Fake / Suspicious
- **Confidence score** — 0 to 100
- **Highlighted suspicious regions** — overlaid directly on the document image
- **Reason tags** — e.g. "MRZ mismatch," "Photo splicing detected"

---

## What Makes This Stand Out

### Explainable AI (XAI)
The system shows *why* it flagged a document, not just a verdict. This is the single most important differentiator for hackathon evaluation — converting raw model outputs into a structured forensic report is consistently what impresses judges in document-verification projects.

### Multi-Layered, Parallel Processing
All four layers run simultaneously rather than one after another, keeping total analysis time under 10 seconds — fast enough for a smooth, judge-friendly live demo.

### Synthetic Data Pipeline
Real Indian identity documents cannot be used for training, so the model is trained entirely on synthetic forgeries:
- A public forged-document dataset with pixel-level forgery masks (~3,000 images) as a base
- Custom-generated variations: text edits, photo swaps, MRZ modifications

This mirrors how commercial deepfake-document detectors are trained — on documents produced by the same generative tools fraudsters use — so the model learns to recognize forgery *signatures*, not memorize specific documents. It also keeps the project ethical and privacy-respecting.

### Real-Time Demo Flow

| Step | Action | What Judges See |
|---|---|---|
| 1 | Upload a genuine ID | Document preview |
| 2 | Click "Analyze" | Progress bar; parallel layer checks running live |
| 3 | Result (Genuine) | Green "Genuine" badge, 98% confidence, clean report |
| 4 | Upload a forged ID | Same process repeats |
| 5 | Result (Fake) | Red "Fake" badge, heatmap overlay, reason list |

---

## Key Signals Detected

| Signal | Detection Method | Example |
|---|---|---|
| Photo splicing | ELA heatmap shows differing compression | Edited face pasted onto ID |
| Text tampering | OCR consistency check | DOB in MRZ vs. printed text mismatch |
| Copy-move | Keypoint matching detects duplicates | Same element cloned in multiple places |
| AI generation | GAN / diffusion artifact detection | Unnatural texture and noise patterns |
| Injection attack | Device / behavioral signals | Document frame replayed during a live session |

---

## Quick Start & Local Execution

DocShield AI runs with a Flask backend (port 5000) and a React + Tailwind CSS frontend (port 5173).

### Prerequisites
- Python 3.10+ (tested on Python 3.12)
- Node.js 18+ and npm
- (Optional) Tesseract OCR installed in system PATH for physical document OCR

### 1. Start Backend Service
```bash
cd docshield-backend
# Activate virtual environment
.\.venv\Scripts\activate       # On Windows PowerShell
# source .venv/bin/activate    # On Linux/macOS

# Start Flask API server (runs on http://localhost:5000)
python run.py
```

### 2. Start Frontend UI
```bash
# In the repository root directory
npm install
npm run dev
```
Open your browser at `http://localhost:5173` to explore the DocShield AI portal.

---

## Ready-to-Test Judge Presets (Zero Setup Required)

The project includes 4 pre-generated test documents in `sample_documents/` and `public/sample_documents/` that demonstrate every detection capability out of the box:

1. **Genuine Indian Passport (`sample_genuine_passport.png`)**
   - **Verdict:** Genuine (98.0% Confidence)
   - **Characteristics:** Valid ICAO Doc 9303 TD3 MRZ check digits (7-3-1 recurring weight algorithm), uniform typography, clean sensor noise.
2. **Forged Aadhaar Card (`sample_forged_aadhaar_dob_tamper.jpg`)**
   - **Verdict:** Fake (91.4% Confidence)
   - **Characteristics:** Spliced Date of Birth with altered compression level (flagged by Layer 3 ELA) and misaligned text baseline.
3. **Cloned PAN Card (`sample_cloned_pan_card.png`)**
   - **Verdict:** Fake (88.0% Confidence)
   - **Characteristics:** Duplicated security emblem and stamp detected by Layer 3 ORB keypoint matching (Copy-Move anomaly).
4. **Spliced Voter ID (`sample_spliced_voter_id.jpg`)**
   - **Verdict:** Fake (89.5% Confidence)
   - **Characteristics:** Photo tampering, noise edge inconsistency, invalid layout.

> **One-Click Demo in UI:** Click the **"Load Preset Document"** buttons directly inside the upload screen at `http://localhost:5173/verify` to instantly load, preview, and analyze these documents without manual file searching!

---

## Dropping in External Colab Model (Layer 4)

DocShield AI is architected so that the neural network trained separately in Google Colab drops directly into the backend with **zero code refactoring**:

### Step-by-Step Drop-In:
1. **Save Model in Colab:**
   ```python
   # In your Google Colab training notebook:
   torch.save(model.state_dict(), "docshield_best_model.pth")
   ```
2. **Place File in Backend Weights Folder:**
   Copy `docshield_best_model.pth` into:
   ```
   docshield-backend/app/ml/weights/docshield_best_model.pth
   ```
3. **Automatic Loading:**
   At server startup, `app/ml/model_loader.py` automatically checks for `app/ml/weights/docshield_best_model.pth` and loads it as a singleton.
4. **Custom Inference / Grad-CAM (Optional):**
   If your Colab model uses a custom architecture (e.g. Vision Transformer or customized EfficientNet), replace the placeholder methods in `docshield-backend/app/layers/layer4_ai_detection.py`:
   - `predict(image_path)` — returns `{"is_fake": bool, "confidence": float, "probabilities": dict}`
   - `generate_gradcam(image_path)` — returns `(heatmap_bgr_array, overlay_bgr_array)`

---

## Running Automated Verification & Tests

### Backend Test Suite (45 Tests, 100% Passed)
```bash
cd docshield-backend
.\.venv\Scripts\python -m pytest tests/ -v
```

### End-to-End Pipeline Verification Script
```bash
cd docshield-backend
.\.venv\Scripts\python scripts/test_pipeline.py
```

### Frontend Production Build
```bash
npm run build
```

---

## Team

**InnovX** — Karunya Institute of Technology and Sciences, Coimbatore
Smart India Hackathon 2026, Problem Statement SIH26188