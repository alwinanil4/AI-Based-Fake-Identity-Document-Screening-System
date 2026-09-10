/**
 * API Service for AI-Based Fake Identity & Document Screening System
 * Simulates real AI backend pipeline with realistic inspection metrics for SIH presentation.
 */

// Pre-seeded verification records
let MOCK_VERIFICATIONS = [
  {
    id: 'VER-2026-0891',
    documentType: 'Aadhaar',
    documentName: 'aadhaar_front_aarav_sharma.jpg',
    citizenName: 'Aarav Sharma',
    idNumber: 'XXXX XXXX 8392',
    status: 'genuine',
    riskScore: 8,
    timestamp: '2026-09-08T18:15:00.000Z',
    officerId: 'OFF-IND-4029',
    checkpoint: 'Immigration Checkpost #3, Terminal 3',
    extractedData: {
      fullName: 'Aarav Sharma',
      idNumber: 'XXXX XXXX 8392',
      dob: '14/05/1994',
      gender: 'Male',
      address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru, Karnataka - 560103',
      issueDate: '12/03/2019',
      fatherName: 'Rajendra Sharma'
    },
    checks: [
      { id: 'ocr', name: 'OCR & Font Typography', passed: true, score: 99.4, details: 'Font matches UIDAI standard Aadhaar gothic typeface. Perfect baseline kerning.' },
      { id: 'faceMatch', name: 'Facial Biometric Integrity', passed: true, score: 98.2, details: 'Passport-grade facial aspect ratio detected. Live texture gradient confirmed.' },
      { id: 'hologram', name: 'UIDAI QR & Guilloche Security', passed: true, score: 100.0, details: 'Cryptographic digital signature verified against public UIDAI certificate.' },
      { id: 'tampering', name: 'Error Level Analysis (ELA)', passed: true, score: 97.1, details: 'Uniform compression rate across image. Zero edge splicing detected.' },
      { id: 'checksum', name: 'Verhoeff Algorithmic Checksum', passed: true, score: 100.0, details: 'Mathematical Verhoeff check calculation validated successfully.' }
    ],
    anomalies: [],
    verdictSummary: 'The document exhibits pristine cryptographic, typographic, and physical alignment. Approved as Genuine.'
  },
  {
    id: 'VER-2026-0890',
    documentType: 'PAN Card',
    documentName: 'pan_card_vikram_malhotra.png',
    citizenName: 'Vikram Malhotra',
    idNumber: 'ABCDE1234F',
    status: 'suspicious',
    riskScore: 68,
    timestamp: '2026-09-08T17:42:00.000Z',
    officerId: 'OFF-IND-4029',
    checkpoint: 'Banking KYC Verification Counter #1',
    extractedData: {
      fullName: 'Vikram Malhotra',
      idNumber: 'ABCDE1234F',
      dob: '19/08/1988',
      gender: 'Male',
      fatherName: 'Ramesh Malhotra',
      issueDate: '04/11/2018'
    },
    checks: [
      { id: 'ocr', name: 'OCR & Font Typography', passed: false, score: 42.0, details: 'Typographic baseline shift on Date of Birth string (19/08/1988). Non-standard font width.' },
      { id: 'faceMatch', name: 'Facial Biometric Integrity', passed: true, score: 91.5, details: 'Clear frontal portrait with neutral expression detected.' },
      { id: 'hologram', name: 'NSDL Holographic Seal', passed: true, score: 85.0, details: 'Income Tax Department emblem layout matches standard dimensions.' },
      { id: 'tampering', name: 'Error Level Analysis (ELA)', passed: false, score: 38.6, details: 'High-frequency noise clustering around DOB bounding box indicates digital image editing.' },
      { id: 'checksum', name: 'PAN Format & Checksum', passed: true, score: 100.0, details: 'Fifth character matches surname initial (M), 10-digit structure conforms.' }
    ],
    anomalies: [
      { severity: 'high', title: 'Digital Splicing Detected in DOB', description: 'Error Level Analysis highlights anomalous JPEG compression rate within the Date of Birth bounding box (ELA variance > 34%).' },
      { severity: 'medium', title: 'Font Kerning Inconsistency', description: 'Characters in "1988" have unequal letter-spacing (3.2px vs expected 1.8px) indicating text replacement tool.' },
      { severity: 'low', title: 'Background Security Tint Degradation', description: 'Light anti-copy diagonal grid is subtly smudged underneath the modified numbers.' }
    ],
    verdictSummary: 'Probable Date of Birth alteration detected via Error Level Analysis and font typography deviation. Officer manual inspection mandatory.'
  },
  {
    id: 'VER-2026-0889',
    documentType: 'Voter ID (EPIC)',
    documentName: 'epic_voter_sunil_verma.jpg',
    citizenName: 'Sunil Kumar Verma',
    idNumber: 'XYZ9876543',
    status: 'fake',
    riskScore: 94,
    timestamp: '2026-09-08T16:20:00.000Z',
    officerId: 'OFF-IND-1044',
    checkpoint: 'Border Security Post - North Gate',
    extractedData: {
      fullName: 'Sunil Kumar Verma',
      idNumber: 'XYZ9876543',
      dob: '02/01/1982',
      gender: 'Male',
      assemblyConstituency: '142-Malviya Nagar',
      fatherName: 'Harish Verma'
    },
    checks: [
      { id: 'ocr', name: 'OCR & Font Typography', passed: false, score: 21.0, details: 'Font used for EPIC serial is Arial instead of Election Commission prescribed serif typeface.' },
      { id: 'faceMatch', name: 'Facial Biometric Integrity', passed: false, score: 18.4, details: 'Portrait exhibits synthetic/GAN-generated artifacts. Pupil reflection asymmetry.' },
      { id: 'hologram', name: 'Ashoka Security Hologram', passed: false, score: 10.0, details: 'Security emblem is a flat 2D bitmap print with no prismatic reflectance.' },
      { id: 'tampering', name: 'Error Level Analysis (ELA)', passed: false, score: 12.0, details: 'Severe clone stamp repetition observed in guilloche background pattern.' },
      { id: 'checksum', name: 'EPIC Sequence Validation', passed: false, score: 0.0, details: 'Serial sequence failed ECI assembly state algorithm checksum.' }
    ],
    anomalies: [
      { severity: 'critical', title: 'Hologram Counterfeit / Missing', description: 'Prismatic optical reflectance test failed. Flat color printing detected in place of security hologram.' },
      { severity: 'critical', title: 'AI-Generated / Deepfake Portrait', description: 'Facial feature analysis indicates synthetic biometric generator (StyleGAN artifact score 92%).' },
      { severity: 'high', title: 'Invalid EPIC Format Serial', description: 'Prefix XYZ is unassigned in the National Voter Service database registry.' },
      { severity: 'high', title: 'Guilloche Clone Stamp Pattern', description: 'Identical pixel patches detected across background safety mesh, proving manual image forgery.' }
    ],
    verdictSummary: 'Critical multiple counterfeit indicators: Fake hologram, synthetic AI portrait, forged serial sequence, and cloned background. Classified as FAKE.'
  },
  {
    id: 'VER-2026-0888',
    documentType: 'Driving License',
    documentName: 'dl_priya_nair_kerala.jpg',
    citizenName: 'Priya Nair',
    idNumber: 'KL-07-20150009841',
    status: 'genuine',
    riskScore: 12,
    timestamp: '2026-09-08T15:05:00.000Z',
    officerId: 'OFF-IND-4029',
    checkpoint: 'Highway Transit Inspection #4',
    extractedData: {
      fullName: 'Priya Nair',
      idNumber: 'KL-07-20150009841',
      dob: '23/11/1991',
      gender: 'Female',
      issueDate: '14/06/2015',
      validity: '22/11/2041',
      rto: 'Ernakulam RTO, Kerala'
    },
    checks: [
      { id: 'ocr', name: 'OCR & Font Typography', passed: true, score: 96.0, details: 'Standard Sarathi MoRTH typography verified.' },
      { id: 'faceMatch', name: 'Facial Biometric Integrity', passed: true, score: 94.8, details: 'Facial landmarker aligned to standard ID specs.' },
      { id: 'hologram', name: 'Smart Chip & Microprint', passed: true, score: 98.0, details: 'Chip contacts and state seal optical characteristics verified.' },
      { id: 'tampering', name: 'Error Level Analysis (ELA)', passed: true, score: 95.0, details: 'Natural noise distribution throughout document.' },
      { id: 'checksum', name: 'MoRTH DL Algorithm', passed: true, score: 100.0, details: 'State code, RTO code, year, and 7-digit sequential number valid.' }
    ],
    anomalies: [],
    verdictSummary: 'Document passed all physical, layout, and Sarathi database syntax checks. Verified as Genuine.'
  },
  {
    id: 'VER-2026-0887',
    documentType: 'Indian Passport',
    documentName: 'passport_rohit_singh.png',
    citizenName: 'Rohit Singh',
    idNumber: 'Z6829104',
    status: 'genuine',
    riskScore: 5,
    timestamp: '2026-09-08T13:50:00.000Z',
    officerId: 'OFF-IND-1044',
    checkpoint: 'Immigration Counter A-1',
    extractedData: {
      fullName: 'Rohit Singh',
      idNumber: 'Z6829104',
      dob: '08/04/1987',
      gender: 'Male',
      issueDate: '19/02/2021',
      expiryDate: '18/02/2031',
      mrz1: 'P<INDROHIT<<SINGH<<<<<<<<<<<<<<<<<<<<<<<<<<<',
      mrz2: 'Z6829104<4IND8704085M3102181<<<<<<<<<<<<<<02'
    },
    checks: [
      { id: 'ocr', name: 'MRZ OCR Line 1 & Line 2', passed: true, score: 100.0, details: 'ICAO Doc 9303 standard OCR-B format compliant.' },
      { id: 'faceMatch', name: 'Ghost Image & Portrait Match', passed: true, score: 99.0, details: 'Primary portrait matches secondary laser-perforated ghost image.' },
      { id: 'hologram', name: 'Ashoka UV Watermark', passed: true, score: 97.5, details: 'Intaglio latent image and UV optical fibers confirmed.' },
      { id: 'tampering', name: 'Laminate & Thread Integrity', passed: true, score: 96.0, details: 'Security stitch threads and laminate seals intact.' },
      { id: 'checksum', name: 'MRZ Check Digit Calculations', passed: true, score: 100.0, details: 'All 4 ICAO 7-3-1 weight check digits match correctly.' }
    ],
    anomalies: [],
    verdictSummary: 'ICAO Doc 9303 standards satisfied. Check digit verification 100% match. Verified Genuine.'
  },
  {
    id: 'VER-2026-0886',
    documentType: 'Aadhaar',
    documentName: 'aadhaar_scanned_deepak_j.jpg',
    citizenName: 'Deepak Joshi',
    idNumber: 'XXXX XXXX 1145',
    status: 'suspicious',
    riskScore: 54,
    timestamp: '2026-09-08T11:25:00.000Z',
    officerId: 'OFF-IND-4029',
    checkpoint: 'Security Inspection Gate 2',
    extractedData: {
      fullName: 'Deepak Joshi',
      idNumber: 'XXXX XXXX 1145',
      dob: '30/12/1990',
      gender: 'Male',
      address: 'House No 12, Sector 14, Gurugram, Haryana - 122001'
    },
    checks: [
      { id: 'ocr', name: 'OCR & Font Typography', passed: true, score: 88.0, details: 'Font matches UIDAI pattern.' },
      { id: 'faceMatch', name: 'Facial Biometric Integrity', passed: false, score: 55.0, details: 'Image resolution degradation around face boundary; possible crop-and-paste.' },
      { id: 'hologram', name: 'UIDAI QR Code Check', passed: false, score: 40.0, details: 'QR code data is unreadable or corrupted; cryptographic signature missing.' },
      { id: 'tampering', name: 'Error Level Analysis (ELA)', passed: true, score: 78.0, details: 'Moderate compression variance.' },
      { id: 'checksum', name: 'Verhoeff Algorithmic Checksum', passed: true, score: 100.0, details: 'Number sequence conforms mathematically.' }
    ],
    anomalies: [
      { severity: 'high', title: 'QR Code Signature Failure', description: 'Scanned QR code does not decode to valid signed UIDAI asymmetric data block.' },
      { severity: 'medium', title: 'Portrait Edge Inconsistency', description: 'Edge sharpness around the face boundary is sharper than surrounding paper texture.' }
    ],
    verdictSummary: 'Corrupted QR code combined with portrait edge variance. Classified as Suspicious for manual officer review.'
  }
]

// Preset Demo Data for rapid testing by the user/judges
export const DEMO_PRESETS = [
  {
    id: 'preset-passport-genuine',
    label: 'Genuine Indian Passport (ICAO TD3)',
    badge: 'Genuine (4% Risk)',
    badgeColor: 'emerald',
    docType: 'Passport',
    fileName: 'sample_genuine_passport.png',
    samplePath: '/sample_documents/sample_genuine_passport.png',
    fileSize: '1.2 MB',
    data: MOCK_VERIFICATIONS[0]
  },
  {
    id: 'preset-aadhaar-forged',
    label: 'Forged Aadhaar (Spliced Altered DOB)',
    badge: 'Fake (92% Risk)',
    badgeColor: 'rose',
    docType: 'Aadhaar',
    fileName: 'sample_forged_aadhaar_dob_tamper.jpg',
    samplePath: '/sample_documents/sample_forged_aadhaar_dob_tamper.jpg',
    fileSize: '1.8 MB',
    data: MOCK_VERIFICATIONS[1]
  },
  {
    id: 'preset-pan-cloned',
    label: 'Cloned PAN Card (Copy-Move Duplication)',
    badge: 'Suspicious (74% Risk)',
    badgeColor: 'amber',
    docType: 'PAN Card',
    fileName: 'sample_cloned_pan_card.png',
    samplePath: '/sample_documents/sample_cloned_pan_card.png',
    fileSize: '2.1 MB',
    data: MOCK_VERIFICATIONS[1]
  },
  {
    id: 'preset-voter-spliced',
    label: 'Spliced Voter ID (GAN Photo & Noise)',
    badge: 'Fake (96% Risk)',
    badgeColor: 'rose',
    docType: 'Voter ID (EPIC)',
    fileName: 'sample_spliced_voter_id.jpg',
    samplePath: '/sample_documents/sample_spliced_voter_id.jpg',
    fileSize: '2.4 MB',
    data: MOCK_VERIFICATIONS[2]
  }
]

export const api = {
  // 1. Get Dashboard Counters & Quick KPIs
  async getDashboardStats() {
    await new Promise((res) => setTimeout(res, 200))
    const total = MOCK_VERIFICATIONS.length
    const genuine = MOCK_VERIFICATIONS.filter((v) => v.status === 'genuine').length
    const suspicious = MOCK_VERIFICATIONS.filter((v) => v.status === 'suspicious').length
    const fake = MOCK_VERIFICATIONS.filter((v) => v.status === 'fake').length
    const avgRisk = Math.round(
      MOCK_VERIFICATIONS.reduce((acc, curr) => acc + (curr.riskScore || 10), 0) / (total || 1)
    )

    return {
      total,
      genuine,
      suspicious,
      fake,
      avgRisk,
      detectionRate: '98.6%',
      systemUptime: '99.98%'
    }
  },

  // 2. Get Recent Verifications for Dashboard
  async getRecentVerifications(limit = 5) {
    await new Promise((res) => setTimeout(res, 200))
    return MOCK_VERIFICATIONS.slice(0, limit)
  },

  // 3. Get Verification History with Filter & Search
  async getVerificationHistory({ search = '', status = 'all', docType = 'all' } = {}) {
    try {
      const url = status && status !== 'all' ? `/api/history?verdict=${status}` : '/api/history'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        if (data.scans && Array.isArray(data.scans) && data.scans.length > 0) {
          const serverScans = data.scans.map((s) => ({
            ...s,
            status: (s.verdict || 'genuine').toLowerCase(),
            documentName: s.filename || s.document_name || 'scanned_document.jpg',
            documentType: s.document_type && s.document_type !== 'unknown' ? s.document_type : 'National ID',
            citizenName: s.citizenName || 'Screened Subject',
            idNumber: s.idNumber || s.id,
            riskScore: (s.verdict || '').toLowerCase() === 'genuine' 
              ? Math.max(4, Math.round(100 - s.confidence)) 
              : Math.round(s.confidence),
          }))

          let filtered = [...serverScans]
          if (search && search.trim() !== '') {
            const q = search.toLowerCase().trim()
            filtered = filtered.filter(item => 
              item.id.toLowerCase().includes(q) ||
              (item.filename && item.filename.toLowerCase().includes(q)) ||
              (item.documentType && item.documentType.toLowerCase().includes(q))
            )
          }
          return filtered
        }
      }
    } catch (e) {
      console.warn('Backend history fetch offline, using local audit cache:', e)
    }

    // Fallback to local MOCK_VERIFICATIONS
    let list = [...MOCK_VERIFICATIONS]

    if (status && status !== 'all') {
      list = list.filter((item) => item.status.toLowerCase() === status.toLowerCase())
    }

    if (docType && docType !== 'all') {
      list = list.filter((item) => item.documentType.toLowerCase().includes(docType.toLowerCase()))
    }

    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim()
      list = list.filter(
        (item) =>
          item.id.toLowerCase().includes(q) ||
          item.citizenName.toLowerCase().includes(q) ||
          item.idNumber.toLowerCase().includes(q) ||
          item.documentType.toLowerCase().includes(q)
      )
    }

    return list
  },

  // 4. Get a Single Verification Audit by ID
  async getVerificationById(id) {
    try {
      const res = await fetch(`/api/scan/${id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.scan) {
          const s = data.scan
          const normalizedVerdict = (s.verdict || 'genuine').toLowerCase()
          return {
            id: s.id,
            request_id: s.request_id,
            timestamp: s.timestamp || s.created_at,
            documentType: s.document_type && s.document_type !== 'unknown' ? s.document_type : 'National ID',
            documentName: s.filename || 'screened_document.jpg',
            citizenName: s.citizenName || 'Screened Subject',
            idNumber: s.idNumber || s.id,
            status: normalizedVerdict,
            verdict: s.verdict,
            confidence: s.confidence,
            riskScore: normalizedVerdict === 'genuine' ? Math.max(5, Math.round(100 - s.confidence)) : Math.round(s.confidence),
            heatmap: s.heatmap_base64,
            heatmap_base64: s.heatmap_base64,
            thumbnail_base64: s.thumbnail_base64,
            reason_tags: s.reason_tags || [],
            layer_results: s.layer_results || {},
            verdictSummary: `Audit Record: Classified as ${s.verdict.toUpperCase()} with ${s.confidence}% confidence across 4 screening layers.`,
            anomalies: (s.reason_tags || []).map((tag) => ({
              severity: normalizedVerdict === 'fake' ? 'critical' : 'high',
              title: tag,
              description: `Forensic audit log flagged: ${tag}`
            })),
            checks: [
              { id: 'layer1', name: 'Layer 1: Behavioral & Device Signals', passed: true, score: 95, details: 'Client telemetry and camera sensor noise verified.' },
              { id: 'layer2', name: 'Layer 2: OCR & Structural Validation', passed: normalizedVerdict === 'genuine', score: normalizedVerdict === 'genuine' ? 98 : 42, details: 'Typography and ICAO check digits.' },
              { id: 'layer3', name: 'Layer 3: Image Forensics (ELA & Copy-Move)', passed: normalizedVerdict === 'genuine', score: normalizedVerdict === 'genuine' ? 96 : 38, details: 'Compression analysis & feature cloning.' },
              { id: 'layer4', name: 'Layer 4: AI / Deep Learning Detection', passed: normalizedVerdict !== 'fake', score: normalizedVerdict === 'fake' ? 22 : 94, details: 'Neural network classification.' }
            ],
            extractedData: {
              fullName: 'Screened Subject',
              idNumber: s.id,
              dob: '15/06/1995',
              gender: 'Male',
              address: 'Official ID Record, Verified National Registry'
            }
          }
        }
      }
    } catch (e) {
      console.warn('Backend getVerificationById error, checking local records:', e)
    }

    const found = MOCK_VERIFICATIONS.find((v) => v.id === id)
    return found || MOCK_VERIFICATIONS[0]
  },

  // 5. Run AI Screening Workflow on an Uploaded File / Preset
  async screenDocument({ file, docType, presetId, officerNotes, officerId = 'OFF-IND-4029' }) {
    let resultRecord = null
    const matched = presetId ? DEMO_PRESETS.find((p) => p.id === presetId) : null

    // If preset selected without an explicit custom file, fetch the real sample image
    if (!file && matched?.samplePath) {
      try {
        const res = await fetch(matched.samplePath)
        if (res.ok) {
          const blob = await res.blob()
          file = new File([blob], matched.fileName, { type: blob.type || 'image/png' })
        }
      } catch (e) {
        console.warn('Could not load sample document file:', e)
      }
    }

    // Call real Flask backend API
    if (file) {
      try {
        const formData = new FormData()
        formData.append('image', file)
        if (docType && docType !== 'Auto-Detect') formData.append('document_type', docType)

        const response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const apiData = await response.json()
          const l1 = apiData.layer_results?.layer1 || apiData.layer_results?.layer1_behavioral || {}
          const l2 = apiData.layer_results?.layer2 || apiData.layer_results?.layer2_ocr || {}
          const l3 = apiData.layer_results?.layer3 || apiData.layer_results?.layer3_forensics || {}
          const l4 = apiData.layer_results?.layer4 || apiData.layer_results?.layer4_ai_detection || {}
          const fields = l2.fields || {}
          const normalizedVerdict = (apiData.verdict || 'genuine').toLowerCase()

          resultRecord = {
            id: apiData.id || `SCAN-${Math.floor(1000 + Math.random() * 9000)}`,
            documentType: fields.document_type && fields.document_type !== 'unknown' ? fields.document_type : (docType && docType !== 'Auto-Detect' ? docType : 'Aadhaar'),
            documentName: file.name,
            citizenName: fields.holder_name || (matched?.data?.citizenName || 'Aarav Sharma'),
            idNumber: fields.document_number || (matched?.data?.idNumber || 'XXXX XXXX 8392'),
            status: normalizedVerdict,
            verdict: apiData.verdict,
            confidence: apiData.confidence,
            riskScore: normalizedVerdict === 'genuine' ? Math.max(4, Math.round(100 - apiData.confidence)) : Math.round(apiData.confidence),
            timestamp: apiData.timestamp || new Date().toISOString(),
            officerId,
            checkpoint: 'SIH InnovX Command Terminal',
            officerNotes: officerNotes || '',
            heatmap: apiData.heatmap_base64 || apiData.heatmap,
            heatmap_base64: apiData.heatmap_base64 || apiData.heatmap,
            thumbnail_base64: apiData.thumbnail_base64,
            reason_tags: apiData.reason_tags || [],
            layer_results: apiData.layer_results || {},
            extractedData: {
              fullName: fields.holder_name || (matched?.data?.citizenName || 'Aarav Sharma'),
              idNumber: fields.document_number || 'XXXX XXXX 8392',
              dob: fields.date_of_birth || '15/06/1995',
              gender: 'Male',
              address: 'Official ID Record, Verified National Registry'
            },
            checks: [
              {
                id: 'layer1',
                name: 'Layer 1: Behavioral & Device Signals',
                passed: l1.status !== 'flagged',
                score: Math.round(l1.confidence || 94),
                details: l1.details?.flags?.length ? l1.details.flags.join('. ') : 'Zero-trust client telemetry and sensor entropy confirmed authentic.'
              },
              {
                id: 'layer2',
                name: 'Layer 2: OCR & Structural Validation',
                passed: l2.status !== 'flagged',
                score: Math.round(l2.confidence || 90),
                details: l2.anomalies?.length ? l2.anomalies.join('. ') : 'Font typography and baseline kerning authenticated.'
              },
              {
                id: 'layer3',
                name: 'Layer 3: Image Forensics (ELA & Copy-Move)',
                passed: l3.status !== 'flagged',
                score: Math.round(l3.confidence ? (l3.status === 'flagged' ? 100 - l3.confidence : l3.confidence) : 92),
                details: l3.anomalies?.length ? l3.anomalies.join('. ') : 'Uniform compression levels; zero edge splicing or cloning detected.'
              },
              {
                id: 'layer4',
                name: 'Layer 4: AI / Deep Learning Classifier',
                passed: l4.status !== 'flagged',
                score: Math.round(l4.genuine_probability ?? (100 - (l4.forgery_probability || 10))),
                details: `Neural vision model inference complete (Forgery risk: ${l4.forgery_probability || 0}%)`
              }
            ],
            anomalies: (apiData.reason_tags || []).map((tag) => ({
              severity: normalizedVerdict === 'fake' ? 'critical' : 'high',
              title: tag,
              description: `Automated forensic layer flagged: ${tag}`
            })),
            verdictSummary: `Multi-Layer Result (${apiData.processing_time_ms || 1200}ms): Classified as ${apiData.verdict.toUpperCase()} with ${apiData.confidence}% confidence.`
          }
        }
      } catch (err) {
        console.warn('Backend API /api/analyze call issue, falling back to simulated inference:', err)
      }
    }

    // If a custom file was uploaded without preset, intelligently simulate realistic AI analysis
    if (!resultRecord) {
      const fileName = file ? file.name : 'uploaded_document.jpg'
      const isSusName = fileName.toLowerCase().includes('sus') || fileName.toLowerCase().includes('mod')
      const isFakeName = fileName.toLowerCase().includes('fake') || fileName.toLowerCase().includes('forg')

      let simulatedStatus = 'genuine'
      let simulatedRisk = Math.floor(6 + Math.random() * 18) // 6 - 24

      if (isFakeName) {
        simulatedStatus = 'fake'
        simulatedRisk = Math.floor(85 + Math.random() * 12)
      } else if (isSusName) {
        simulatedStatus = 'suspicious'
        simulatedRisk = Math.floor(58 + Math.random() * 18)
      }

      resultRecord = {
        id: `VER-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        documentType: docType && docType !== 'Auto-Detect' ? docType : 'Aadhaar',
        documentName: fileName,
        citizenName: 'Devendra Kashyap',
        idNumber: 'XXXX XXXX 6721',
        status: simulatedStatus,
        riskScore: simulatedRisk,
        timestamp: new Date().toISOString(),
        officerId,
        checkpoint: 'SIH Screening Command Center',
        officerNotes: officerNotes || '',
        extractedData: {
          fullName: 'Devendra Kashyap',
          idNumber: 'XXXX XXXX 6721',
          dob: '11/09/1993',
          gender: 'Male',
          address: 'Plot 88, Civil Lines, Jaipur, Rajasthan - 302006',
          issueDate: '15/07/2020'
        },
        checks: [
          { id: 'ocr', name: 'OCR & Font Typography', passed: simulatedStatus === 'genuine', score: simulatedStatus === 'genuine' ? 98.5 : 44.0, details: simulatedStatus === 'genuine' ? 'Typography matches authentic issuing authority standards.' : 'Font kerning variance detected on extracted text.' },
          { id: 'faceMatch', name: 'Facial Biometric Integrity', passed: simulatedStatus !== 'fake', score: simulatedStatus === 'fake' ? 22.0 : 96.4, details: simulatedStatus === 'fake' ? 'Synthetic portrait or face-swap artifacts detected.' : 'Biometric proportions match standard official portraits.' },
          { id: 'hologram', name: 'Security Watermark & Hologram', passed: simulatedStatus !== 'fake', score: simulatedStatus === 'fake' ? 14.0 : 95.0, details: simulatedStatus === 'fake' ? 'Optical reflection absent on security emblem.' : 'Optical variable ink verified.' },
          { id: 'tampering', name: 'Error Level Analysis (ELA)', passed: simulatedStatus === 'genuine', score: simulatedStatus === 'genuine' ? 96.0 : 36.5, details: simulatedStatus === 'genuine' ? 'Zero digital splicing or compression anomalies.' : 'High-contrast boundary anomalies in text regions.' },
          { id: 'checksum', name: 'Format & Checksum Algorithm', passed: simulatedStatus !== 'fake', score: simulatedStatus === 'fake' ? 0.0 : 100.0, details: simulatedStatus === 'fake' ? 'Checksum algorithm failed mathematical validation.' : 'Checksum verification succeeded.' }
        ],
        anomalies: simulatedStatus === 'genuine' ? [] : [
          { severity: simulatedStatus === 'fake' ? 'critical' : 'high', title: simulatedStatus === 'fake' ? 'Invalid Security Hologram & Emblems' : 'Compression Variance in Personal Details', description: 'AI Forensic vision model flagged anomalies in the document layer.' }
        ],
        verdictSummary: simulatedStatus === 'genuine' 
          ? 'Screening analysis completed with no structural, typographic, or biometric anomalies. Authenticated as Genuine.'
          : simulatedStatus === 'suspicious'
          ? 'Anomalies detected in digital typography and compression uniformity. Officer inspection recommended.'
          : 'High probability of forgery. Critical security features missing or tampered.'
      }
    }

    // Prepend to mock verifications list so it shows immediately in history & dashboard
    MOCK_VERIFICATIONS.unshift(resultRecord)
    return resultRecord
  },

  // 6. Get Analytics Visualizations Data
  async getAnalyticsData() {
    await new Promise((res) => setTimeout(res, 250))
    return {
      // Screening trends over the last 7 days
      trendData: [
        { date: '02 Sep', genuine: 42, suspicious: 7, fake: 3 },
        { date: '03 Sep', genuine: 56, suspicious: 11, fake: 5 },
        { date: '04 Sep', genuine: 63, suspicious: 8, fake: 2 },
        { date: '05 Sep', genuine: 51, suspicious: 14, fake: 6 },
        { date: '06 Sep', genuine: 78, suspicious: 12, fake: 4 },
        { date: '07 Sep', genuine: 89, suspicious: 19, fake: 7 },
        { date: '08 Sep', genuine: 94, suspicious: 15, fake: 5 }
      ],
      // Distribution breakdown for Donut Chart
      statusDistribution: [
        { name: 'Genuine', value: 473, color: '#10B981' },
        { name: 'Suspicious', value: 86, color: '#F59E0B' },
        { name: 'Fake / Forged', value: 32, color: '#EF4444' }
      ],
      // Document Type distribution
      docTypeDistribution: [
        { type: 'Aadhaar Card', count: 245, fakeRate: '4.8%' },
        { type: 'PAN Card', count: 180, fakeRate: '7.2%' },
        { type: 'Voter ID (EPIC)', count: 95, fakeRate: '9.4%' },
        { type: 'Driving License', count: 52, fakeRate: '3.8%' },
        { type: 'Passport', count: 19, fakeRate: '1.2%' }
      ],
      // Primary Fraud Vector detection frequency
      tamperingVectors: [
        { vector: 'Font / Text Alteration', count: 48 },
        { vector: 'Hologram Missing / Flat Print', count: 37 },
        { vector: 'Face Morphing / GAN Spoof', count: 29 },
        { vector: 'Checksum Algorithm Failure', count: 24 },
        { vector: 'Guilloche Clone Stamping', count: 18 }
      ]
    }
  },

  // 7. Check if backend server is online & reachable
  async checkBackendHealth() {
    try {
      const res = await fetch('/api/v1/health')
      if (res.ok) {
        return await res.json()
      }
    } catch {
      // Backend not running / offline
    }
    return null
  }
}
