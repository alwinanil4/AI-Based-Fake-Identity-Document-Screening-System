"""DocShield AI — End-to-End Pipeline Verification Script."""

import os
import sys

# Add docshield-backend to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "docshield-backend"))
sys.path.insert(0, backend_dir)

from PIL import Image
from app import create_app
from app.layers.aggregator import execute_parallel_analysis
from app.models.scan import ScanResult
from app.extensions import db

def test_pipeline():
    print("Testing DocShield 4-Layer Forensic Engine...")
    app = create_app("testing")

    sample_path = os.path.join(os.path.dirname(__file__), "..", "sample_documents", "sample_forged_aadhaar_dob_tamper.jpg")
    img = Image.open(sample_path)

    with app.app_context():
        results = execute_parallel_analysis(
            image=img,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"},
            form_data={},
            timeout_seconds=10.0,
        )

        print("\n--- Pipeline Results ---")
        print(f"Verdict: {results['verdict']}")
        print(f"Confidence: {results['confidence']}%")
        print(f"Reason Tags: {results['reason_tags']}")
        print(f"Processing Time: {results['processing_time_ms']} ms")
        print(f"Heatmap Generated: {bool(results['heatmap_base64'])}")
        print(f"Layer 1 Status: {results['layer_results']['layer1']['status']}")
        print(f"Layer 2 Status: {results['layer_results']['layer2']['status']}")
        print(f"Layer 3 Status: {results['layer_results']['layer3']['status']}")
        print(f"Layer 4 Status: {results['layer_results']['layer4']['status']}")

        assert results["verdict"] in ["Genuine", "Fake", "Suspicious"]
        assert results["confidence"] >= 0
        assert results["heatmap_base64"].startswith("data:image/png;base64,")
        print("\nPipeline test PASSED successfully!")

if __name__ == "__main__":
    test_pipeline()
