"""
Live test: Gemini 2.5 Flash document field extraction.
Run from docshield-backend/: .venv\Scripts\python test_ai_extraction.py
"""
import sys, os
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv('.env')

from PIL import Image
from app.layers.gemini_extractor import extract_fields_with_ai

# Use any sample document from the sample_documents folder
TEST_IMAGE = "../sample_documents/sample_genuine_passport.png"
if not os.path.exists(TEST_IMAGE):
    # Try Aadhaar
    TEST_IMAGE = "../sample_documents/sample_genuine_aadhaar.jpg"
if not os.path.exists(TEST_IMAGE):
    import glob
    candidates = glob.glob("../sample_documents/*.png") + glob.glob("../sample_documents/*.jpg")
    TEST_IMAGE = candidates[0] if candidates else None

if not TEST_IMAGE:
    print("ERROR: No test image found in sample_documents/")
    sys.exit(1)

print(f"Testing with: {TEST_IMAGE}")
print("-" * 60)

img = Image.open(TEST_IMAGE)
result = extract_fields_with_ai(img, ocr_text_hint="")

if result:
    print(f"AI Provider     : {result.get('ai_provider', 'unknown')}")
    print(f"Confidence      : {result.get('ai_confidence')}")
    print(f"Document Type   : {result.get('document_type')}")
    print(f"Document Number : {result.get('document_number')}")
    print(f"Holder Name     : {result.get('holder_name')}")
    print(f"Father Name     : {result.get('father_name')}")
    print(f"Date of Birth   : {result.get('date_of_birth')}")
    print(f"Gender          : {result.get('gender')}")
    print(f"Address         : {result.get('address')}")
    print(f"Expiry Date     : {result.get('expiry_date')}")
    print(f"Nationality     : {result.get('nationality')}")
    print(f"Unreadable      : {result.get('unreadable_fields')}")
else:
    print("No result returned — check that GEMINI_API_KEY or GROQ_API_KEY is set in .env")
