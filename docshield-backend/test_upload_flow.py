import urllib.request
import json
import uuid

session_id = 'sess_testfixverify123456789'

boundary = uuid.uuid4().hex
CRLF = b'\r\n'

def make_multipart(boundary, filename, filedata, field='image', content_type='image/png'):
    lines = []
    lines.append(f'--{boundary}'.encode())
    lines.append(f'Content-Disposition: form-data; name="{field}"; filename="{filename}"'.encode())
    lines.append(f'Content-Type: {content_type}'.encode())
    lines.append(b'')
    lines.append(filedata)
    lines.append(f'--{boundary}--'.encode())
    lines.append(b'')
    return CRLF.join(lines)

with open('../sample_documents/sample_genuine_passport.png', 'rb') as f:
    filedata = f.read()

body = make_multipart(boundary, 'passport.png', filedata)
req = urllib.request.Request(
    'http://localhost:5000/api/analyze',
    data=body,
    headers={
        'Content-Type': f'multipart/form-data; boundary={boundary}',
        'X-Session-ID': session_id,
    },
    method='POST'
)

# STEP 1: Analyze
print('=== POST /api/analyze ===')
try:
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode())
        scan_id = data.get('id', '')
        print('Status: 200')
        print('Returned ID:', scan_id)
        print('Verdict:', data.get('verdict'))
        print('Session returned in header:', resp.headers.get('X-Session-ID', '(none - session already existed)'))
except urllib.error.HTTPError as e:
    print('POST status:', e.code)
    print(e.read().decode()[:400])
    exit(1)

# STEP 2: Fetch with SAME session (should succeed = 200)
print()
print(f'=== GET /api/scan/{scan_id} WITH SAME SESSION ===')
req2 = urllib.request.Request(
    f'http://localhost:5000/api/scan/{scan_id}',
    headers={'X-Session-ID': session_id}
)
try:
    with urllib.request.urlopen(req2, timeout=10) as resp2:
        print('Status:', resp2.status, '- SUCCESS')
except urllib.error.HTTPError as e:
    print('Status:', e.code, '(FAILED)', e.read().decode()[:200])

# STEP 3: Fetch WITHOUT session (should be 403 - IDOR still enforced)
print()
print(f'=== GET /api/scan/{scan_id} WITHOUT SESSION (should be 403) ===')
req3 = urllib.request.Request(f'http://localhost:5000/api/scan/{scan_id}')
try:
    with urllib.request.urlopen(req3, timeout=10) as resp3:
        print('Status:', resp3.status, '(UNEXPECTED - security check missing!)')
except urllib.error.HTTPError as e:
    print('Status:', e.code, '- IDOR correctly rejected. Body:', e.read().decode()[:150])
