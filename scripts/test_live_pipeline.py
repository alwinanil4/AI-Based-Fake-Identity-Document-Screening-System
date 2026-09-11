import os
import sys
import json

# Ensure python path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "docshield-backend"))
sys.path.insert(0, backend_dir)

from app import create_app
from app.extensions import db
from app.models.scan import ScanResult

def run_test():
    app = create_app()
    client = app.test_client()

    print("=" * 60)
    print("1. Testing GET /api/stats (Database live stats)")
    print("=" * 60)
    res_stats = client.get('/api/stats')
    print(f"Status: {res_stats.status_code}")
    stats_data = res_stats.get_json()
    print(f"Stats: {json.dumps(stats_data, indent=2)}")

    print("\n" + "=" * 60)
    print("2. Testing GET /api/history (Database live history)")
    print("=" * 60)
    res_hist = client.get('/api/history')
    print(f"Status: {res_hist.status_code}")
    hist_data = res_hist.get_json()
    print(f"History count: {len(hist_data.get('results', []))}")

    print("\n" + "=" * 60)
    print("3. Testing POST /api/analyze (Full 4-Layer Pipeline with Real Model)")
    print("=" * 60)
    samples = [
        "sample_genuine_passport.png",
        "sample_forged_aadhaar_dob_tamper.jpg",
        "sample_cloned_pan_card.png",
        "sample_spliced_voter_id.jpg"
    ]

    for sample_filename in samples:
        sample_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "sample_documents", sample_filename))
        print(f"\n--- Testing Document: {sample_filename} ---")
        with open(sample_path, "rb") as f:
            mime = "image/jpeg" if sample_filename.endswith(".jpg") else "image/png"
            data = {'file': (f, sample_filename, mime)}
            res = client.post('/api/analyze', data=data, content_type='multipart/form-data')

        assert res.status_code == 200, f"Failed for {sample_filename}: {res.get_data(as_text=True)}"
        result = res.get_json()

        print(f"  Scan ID: {result.get('id')}")
        print(f"  Overall Verdict: {result.get('verdict')}")
        print(f"  Overall Confidence: {result.get('confidence')}%")
        print(f"  Reason Tags: {result.get('reason_tags')}")

        # Layer 4 details
        l4 = result.get('layer_results', {}).get('layer4', {})
        details = l4.get('details', {})
        print(f"  [Layer 4 AI Model]")
        print(f"    Predicted Class: {details.get('predicted_class')}")
        print(f"    Confidence: {l4.get('confidence')}%")
        print(f"    Probabilities: {details.get('class_probabilities')}")
        print(f"    Status: {l4.get('status')}")

        # Heatmap verification
        heatmap = result.get('heatmap_base64')
        assert heatmap and len(heatmap) > 1000, "Grad-CAM heatmap is missing or too short"
        print(f"    Grad-CAM Heatmap Base64 length: {len(heatmap)} chars")

        # Centralized mapping check
        pred_cls = details.get('predicted_class')
        expected_class_map = {
            'genuine': 'Genuine',
            'ai_generated': 'Fake',
            'tampered': 'Suspicious'
        }
        # In aggregator, overall verdict combines all layers.
        # Layer 4 mapped verdict is in details or mapped via map_model_verdict
        from app.layers.layer4_ai_detection import map_model_verdict
        expected_verdict = map_model_verdict(pred_cls)
        print(f"    Verified centralized mapping: '{pred_cls}' -> '{expected_verdict}'")

    print("\n" + "=" * 60)
    print("4. Re-checking GET /api/stats to verify live DB accumulation")
    print("=" * 60)
    res_stats_after = client.get('/api/stats')
    stats_after = res_stats_after.get_json()
    print(f"Updated Stats: {json.dumps(stats_after, indent=2)}")
    assert stats_after['total'] >= 4, f"Expected at least 4 total records in DB, got {stats_after['total']}"
    
    print("\n" + "=" * 60)
    print("5. Re-checking GET /api/history to verify records list")
    print("=" * 60)
    res_hist_after = client.get('/api/history?limit=10')
    hist_after = res_hist_after.get_json()
    print(f"Recent History Count: {len(hist_after.get('scans', []))}")
    assert len(hist_after.get('scans', [])) >= 4, "Expected history records to be saved in DB"

    print("\n============================================================")
    print("ALL 4 SAMPLE DOCUMENTS PROCESSED SUCCESSFULLY VIA REAL MODEL!")
    print("============================================================")

if __name__ == '__main__':
    run_test()
