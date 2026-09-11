"""DocShield AI — Real Trained Model & Grad-CAM Verification Script.

Tests docshield_best_model.pth against all 4 test documents:
1. sample_genuine_passport.png
2. sample_forged_aadhaar_dob_tamper.jpg
3. sample_cloned_pan_card.png
4. sample_spliced_voter_id.jpg
"""

import os
import sys

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, os.path.abspath("docshield-backend"))

from PIL import Image
from app.layers.layer4_ai_detection import predict, generate_heatmap_base64, map_model_verdict, run_layer4

SAMPLE_DIR = "sample_documents"
sample_files = [
    "sample_genuine_passport.png",
    "sample_forged_aadhaar_dob_tamper.jpg",
    "sample_cloned_pan_card.png",
    "sample_spliced_voter_id.jpg",
]

print("=" * 70)
print("DocShield AI — Layer 4 Real Model & Grad-CAM Verification")
print("=" * 70)

for fname in sample_files:
    fpath = os.path.join(SAMPLE_DIR, fname)
    if not os.path.exists(fpath):
        print(f"Skipping {fname} (file not found)")
        continue

    print(f"\nEvaluating: {fname}")
    img = Image.open(fpath).convert("RGB")

    # 1. Run raw predict
    pred = predict(img)
    raw_class = pred["verdict"]
    ui_verdict = map_model_verdict(raw_class)
    conf = pred["confidence"]
    probs = pred["probabilities"]

    print(f"  -> Predicted Class: {raw_class} (UI Verdict: {ui_verdict})")
    print(f"  -> Softmax Confidence: {conf}%")
    print(f"  -> Full Probability Vector: {probs}")

    # 2. Run Layer 4 full pipeline
    l4_result = run_layer4(img)
    heatmap_len = len(l4_result.get("heatmap_base64") or "")
    print(f"  -> Layer 4 Status: {l4_result['status']}")
    print(f"  -> Grad-CAM Heatmap Base64 Length: {heatmap_len} chars")

    assert raw_class in ["ai_generated", "genuine", "tampered"]
    assert 0.0 <= conf <= 100.0
    assert heatmap_len > 100, "Grad-CAM heatmap must be a non-empty base64 string!"

print("\n" + "=" * 70)
print("ALL LAYER 4 REAL MODEL INFERENCE & GRAD-CAM TESTS PASSED SUCCESSFULLY!")
print("=" * 70)
