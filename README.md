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

## Technology Stack

| Layer | Technology | Why |
|---    |---         |---  |
| Frontend | React.js + Tailwind CSS | Fast to build, judge-friendly UI |
| Backend | Flask (Python) | Straightforward ML integration |
| OCR | Tesseract OCR / EasyOCR | Pre-trained, works offline |
| Barcode / MRZ | zbarcam + custom parser | Quick structural validation |
| Image Forensics | OpenCV + PIL | ELA, copy-move detection |
| Deep Learning | PyTorch + EfficientNet | Lightweight, accurate |
| Vision Transformer | ViT-based backbone (optional) | Top-tier forgery localization |
| Database | SQLite / MongoDB | Scan history for admin demo |

---

## Pitch Emphasis Points

- **Explainable AI** — the system doesn't just give a verdict, it shows the evidence
- **Multi-layer defense** — no single point of failure; all layers run in parallel
- **Real-time** — results in seconds, not minutes
- **Scalable** — deployable at banks, airports, and government offices
- **Ethical AI** — trained entirely on synthetic data, respects user privacy

---

## Impact & Deployment

DocShield AI is designed for deployment wherever identity documents need to be verified at scale and speed matters:

- Banks (KYC verification)
- Airports (travel document checks)
- Government offices (ID and license verification)

Because it trains only on synthetic data, it avoids the privacy and legal issues of using real government-issued documents, while still learning to recognize the forgery techniques currently used by fraudsters.

---

## Team

**InnovX** — Karunya Institute of Technology and Sciences, Coimbatore
Smart India Hackathon 2026, Problem Statement SIH26188