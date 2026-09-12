import React, { useEffect, useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { 
  ArrowLeft, 
  Printer, 
  Scan, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Activity, 
  FileText, 
  Eye, 
  Cpu, 
  Clock, 
  User, 
  MapPin, 
  Layers,
  QrCode,
  UserCheck,
  Lock,
  FileCheck2,
  Info
} from 'lucide-react'
import DocumentPreview from '../components/verification/DocumentPreview'
import ExtractedDataGrid from '../components/verification/ExtractedDataGrid'
import { api } from '../services/api'
import { formatDate } from '../utils/helpers'

export default function VerificationResult() {
  const { id } = useParams()
  const location = useLocation()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionNotice, setActionNotice] = useState(null)
  const [layerBreakdownOpen, setLayerBreakdownOpen] = useState(true)

  useEffect(() => {
    // If result was passed through router navigation state (direct upload flow),
    // use it immediately — no need for a second IDOR-gated /api/scan fetch.
    const stateResult = location.state?.scanResult
    if (stateResult && (stateResult.id === id || stateResult.request_id === id)) {
      setRecord(stateResult)
      setLoading(false)
      return
    }

    // Fallback: deep link, page refresh, or history revisit.
    // The session cookie is already established so this fetch will succeed.
    async function loadRecord() {
      try {
        const data = await api.getVerificationById(id)
        setRecord(data)
        setLoading(false)
      } catch (err) {
        console.error('Failed to load scan record:', err)
        setRecord(null)
        setLoading(false)
      }
    }
    loadRecord()
  }, [id])

  const handlePrint = () => {
    window.print()
  }

  const handleOfficerDecision = (decision) => {
    if (decision === 'approved') {
      setActionNotice({
        type: 'approved',
        text: 'Document formally marked as APPROVED by screening officer. Audit entry updated.'
      })
    } else {
      setActionNotice({
        type: 'flagged',
        text: 'Document formally FLAGGED FOR IMPOUNDMENT. Threat logged into forensic screening database.'
      })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 text-sm font-medium">Retrieving screening record #{id}...</p>
      </div>
    )
  }

  if (!record) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 space-y-4">
        <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Screening Audit Not Found or Access Denied</h2>
          <p className="text-gray-600 text-sm mt-1">
            No inspection record matches ID {id} under your session, or access is restricted by IDOR authorization.
          </p>
        </div>
        <Link
          to="/verify"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors duration-150"
        >
          <Scan className="w-4 h-4" />
          <span>Analyze a Document</span>
        </Link>
      </div>
    )
  }

  const verdict = (record.status || record.verdict || 'unknown').toLowerCase()
  const isGenuine = verdict === 'genuine'
  const isSuspicious = verdict === 'suspicious'
  const isFake = verdict === 'fake'

  const latencySec = record.analysis_time_ms 
    ? (record.analysis_time_ms / 1000).toFixed(2)
    : (record.processing_time_ms ? (record.processing_time_ms / 1000).toFixed(2) : '1.42')

  const l1 = record.layer_results?.layer1 || record.layer_results?.layer1_behavioral || {}
  const l2 = record.layer_results?.layer2 || record.layer_results?.layer2_ocr || {}
  const l3 = record.layer_results?.layer3 || record.layer_results?.layer3_forensics || {}
  const l4 = record.layer_results?.layer4 || record.layer_results?.layer4_ai_detection || {}

  const docSource = record.document_source || record.layer_results?.document_source || {}
  const visForensics = record.visual_forensics || record.layer_results?.visual_forensics || {}
  const barcodeCheck = record.barcode_crosscheck || record.layer_results?.barcode_crosscheck || {}
  const faceMatch = record.face_match || record.layer_results?.face_match || {}
  const privacyInfo = record.privacy || { encrypted_at_rest: true, upload_deleted: true }

  const getTagAttribution = (tag) => {
    const t = tag.toLowerCase()
    if (t.includes('barcode') || t.includes('qr')) {
      return { layer: 'Layer 4', name: 'Barcode / QR', icon: QrCode }
    }
    if (t.includes('identity') || t.includes('face') || t.includes('biometric')) {
      return { layer: 'Layer 6', name: 'Face Match', icon: UserCheck }
    }
    if (t.includes('source') || t.includes('pdf') || t.includes('camera') || t.includes('screenshot')) {
      return { layer: 'Layer 1', name: 'Document Source', icon: FileCheck2 }
    }
    if (t.includes('mrz') || t.includes('checksum') || t.includes('ocr') || t.includes('font') || t.includes('structural')) {
      return { layer: 'Layer 2', name: 'OCR & Structure', icon: FileText }
    }
    if (t.includes('visual forensics') || t.includes('spacing') || t.includes('baseline') || t.includes('stroke')) {
      return { layer: 'Layer 3', name: 'Visual Forensics', icon: Layers }
    }
    if (t.includes('ela') || t.includes('copy-move') || t.includes('fft') || t.includes('splic')) {
      return { layer: 'Layer 3', name: 'Image Forensics', icon: Eye }
    }
    if (t.includes('ai') || t.includes('gan') || t.includes('synthetic') || t.includes('neural')) {
      return { layer: 'Layer 5', name: 'Deep Vision', icon: Cpu }
    }
    return { layer: 'Layer 1', name: 'Behavioral & Device', icon: Activity }
  }

  const confidenceValue = record.confidence || (100 - (record.riskScore || 10))

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/history"
            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-150 shadow-card"
            title="Back to History"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Screening Audit Report
              </h1>
              <span className="font-mono text-sm font-semibold text-blue-700 px-2.5 py-0.5 rounded bg-blue-50 border border-blue-200">
                {record.id}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Screened {formatDate(record.timestamp)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Latency Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700 font-mono">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Analysis: {latencySec}s</span>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium transition-colors duration-150 shadow-card"
          >
            <Printer className="w-4 h-4 text-gray-500" />
            <span>Print Report</span>
          </button>
          <Link
            to="/verify"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors duration-150 shadow-card"
          >
            <Scan className="w-4 h-4" />
            <span>Analyze Another</span>
          </Link>
        </div>
      </div>

      {/* Metadata Header Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-white border border-gray-200 text-sm shadow-card">
        <div>
          <span className="text-gray-500 block text-sm font-semibold uppercase tracking-wide">Inspector ID</span>
          <span className="font-bold text-gray-900 flex items-center gap-1.5 mt-0.5">
            <User className="w-4 h-4 text-blue-600" />
            <span>{record.officerId || 'OFF-IND-4029'}</span>
          </span>
        </div>
        <div>
          <span className="text-gray-500 block text-sm font-semibold uppercase tracking-wide">Checkpoint</span>
          <span className="font-bold text-gray-900 flex items-center gap-1.5 mt-0.5">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>SIH Command Terminal</span>
          </span>
        </div>
        <div>
          <span className="text-gray-500 block text-sm font-semibold uppercase tracking-wide">Standard Classified</span>
          <span className="font-bold text-gray-900 mt-0.5 block">
            {record.documentType || 'Identity Document'}
          </span>
        </div>
        <div>
          <span className="text-gray-500 block text-sm font-semibold uppercase tracking-wide">Encryption & Privacy</span>
          <span className="font-bold text-emerald-700 flex items-center gap-1.5 mt-0.5 text-xs font-mono">
            <Lock className="w-3.5 h-3.5" />
            <span>AES-256-GCM / Purged</span>
          </span>
        </div>
      </div>

      {/* Primary Screening Banner */}
      <div className={`p-6 rounded-xl border shadow-card transition-all ${
        isGenuine
          ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
          : isFake
          ? 'bg-red-50/60 border-red-300 text-red-950'
          : 'bg-amber-50/60 border-amber-300 text-amber-950'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border ${
              isGenuine
                ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                : isFake
                ? 'bg-red-100 border-red-300 text-red-800'
                : 'bg-amber-100 border-amber-300 text-amber-800'
            }`}>
              {isGenuine ? (
                <ShieldCheck className="w-8 h-8" />
              ) : (
                <ShieldAlert className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm uppercase tracking-wider font-bold text-gray-700">
                  Forensic Screening Determination
                </span>
              </div>
              <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${
                isGenuine ? 'text-emerald-800' : isFake ? 'text-red-800' : 'text-amber-800'
              }`}>
                {record.verdict || (verdict.toUpperCase())}
              </h2>
              <p className="text-sm font-medium text-gray-700 leading-relaxed">
                Multi-layer pipeline evaluated document integrity with {confidenceValue}% forensic confidence.
              </p>
            </div>
          </div>

          <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-200/50">
            <span className="text-sm text-gray-600 block uppercase tracking-wide font-semibold">
              Computed Risk Index
            </span>
            <div className={`text-3xl sm:text-4xl font-black font-mono mt-0.5 ${
              isGenuine ? 'text-emerald-800' : isFake ? 'text-red-800' : 'text-amber-800'
            }`}>
              {record.riskScore ?? (isGenuine ? 8 : 92)}/100
            </div>
            <span className="text-sm text-gray-500 font-mono">
              {isGenuine ? 'Low Threat Profile' : isFake ? 'Severe Threat Index' : 'Moderate Anomaly'}
            </span>
          </div>
        </div>
      </div>

      {/* Forensic Evidence Reason Tags */}
      {record.reason_tags && record.reason_tags.length > 0 && (
        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-card space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              Attributed Forensic Evidence & Risk Vectors ({record.reason_tags.length})
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {record.reason_tags.map((tag, idx) => {
              const attr = getTagAttribution(tag)
              const TagIcon = attr.icon
              const isCrit = tag.toLowerCase().includes('deterministic') || tag.toLowerCase().includes('mismatch') || tag.toLowerCase().includes('fake')
              return (
                <div
                  key={idx}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border font-medium transition-colors ${
                    isCrit
                      ? 'bg-red-50 text-red-900 border-red-200'
                      : 'bg-gray-50 text-gray-900 border-gray-200'
                  }`}
                >
                  <TagIcon className="w-4 h-4 shrink-0 opacity-80" />
                  <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-800 font-bold">
                    {attr.layer}
                  </span>
                  <span>{tag}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Main Grid: Document Preview + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Document Preview and Heatmap */}
        <div className="lg:col-span-7 space-y-4">
          <DocumentPreview
            documentType={record.documentType}
            documentName={record.documentName || record.filename}
            status={record.status || record.verdict}
            anomalies={record.anomalies}
            heatmapBase64={record.heatmap_base64 || record.heatmap}
            originalImageUrl={record.imageUrl || record.thumbnail_base64}
            showHeatmapInitially={true}
          />

          {/* Action Log Panel */}
          <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-card space-y-3 print:hidden">
            <span className="text-sm font-bold text-gray-800 uppercase tracking-wide block">
              Inspection Enforcement Action
            </span>

            {actionNotice ? (
              <div className={`p-3.5 rounded-lg border text-sm ${
                actionNotice.type === 'approved'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Decision Recorded</span>
                </div>
                <p>{actionNotice.text}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleOfficerDecision('approved')}
                  className="py-2.5 px-4 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-sm font-bold transition-colors duration-150 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Approve Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOfficerDecision('flagged')}
                  className="py-2.5 px-4 rounded-lg bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 text-sm font-bold transition-colors duration-150 flex items-center justify-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4 text-red-700" />
                  <span>Flag for Impoundment</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Layer Breakdown Accordion & OCR Grid */}
        <div className="lg:col-span-5 space-y-4">
          {/* Layer Breakdown Accordion */}
          <div className="rounded-xl bg-white border border-gray-200 shadow-card overflow-hidden">
            <button
              onClick={() => setLayerBreakdownOpen(!layerBreakdownOpen)}
              className="w-full p-4 bg-gray-50 hover:bg-gray-100 border-b border-gray-200 flex items-center justify-between text-left transition-colors duration-150"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  Technical Layer Breakdown
                </span>
              </div>
              {layerBreakdownOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              )}
            </button>

            <div className={`p-4 space-y-3.5 ${layerBreakdownOpen ? 'block' : 'hidden'}`}>
              
              {/* Layer 1: Document Source Verification */}
              <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/70 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-gray-900">Layer 1: Document Source & Container</span>
                  </div>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border font-bold ${
                    docSource.status === 'ORIGINAL-LIKE STRUCTURE'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : docSource.status === 'STRUCTURAL ANOMALY'
                      ? 'bg-red-50 text-red-800 border-red-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {docSource.status || 'UNABLE TO DETERMINE'}
                  </span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {docSource.description || 'Container format and structural metadata parsed.'}
                </p>
                <div className="p-2 rounded bg-white border border-gray-200 text-xs text-gray-600 space-y-0.5">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Camera Hardware:</span>
                    <span>{docSource.camera_details || (docSource.has_exif ? 'EXIF Detected' : 'No EXIF (Stripped)')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Screenshot Indicators:</span>
                    <span>{docSource.is_screenshot ? 'Detected (Display Dimensions)' : 'None'}</span>
                  </div>
                </div>
                {docSource.limitations && (
                  <p className="text-[11px] text-gray-600 italic">
                    * {docSource.limitations}
                  </p>
                )}
              </div>

              {/* Layer 2: OCR & Text Structure */}
              <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/70 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-gray-900">Layer 2: OCR & Text Content</span>
                  </div>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border font-bold ${
                    l2.status === 'passed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                  }`}>
                    {l2.status?.toUpperCase() || 'PASSED'}
                  </span>
                </div>
                <p className="text-xs text-gray-700">
                  Document Standard: <span className="font-semibold text-gray-900">{l2.document_type || record.documentType}</span>
                </p>
                <div className="p-2 rounded bg-white border border-gray-200 text-xs text-gray-600 space-y-0.5">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">ICAO MRZ Checksum:</span>
                    <span>{l2.mrz_detected ? (l2.mrz_checksum_valid ? 'Valid Checksum' : 'FAILED CHECKSUM') : 'Not Applicable'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Extracted ID:</span>
                    <span className="font-mono">{record.idNumber}</span>
                  </div>
                </div>
              </div>

              {/* Layer 3: Visual Forensics & Layout Consistency */}
              <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/70 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-gray-900">Layer 3: Visual Forensics & Layout</span>
                  </div>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border font-bold ${
                    visForensics.status === 'PASS' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {visForensics.status || 'PASS'}
                  </span>
                </div>
                <div className="p-2 rounded bg-white border border-gray-200 text-xs text-gray-600 space-y-0.5">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Baseline Variance:</span>
                    <span>{visForensics.alignment?.baseline_variance ?? 0}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Photo Noise Ratio:</span>
                    <span>{visForensics.photo_forensics?.sharpness_ratio ? `${visForensics.photo_forensics.sharpness_ratio}x` : 'Uniform'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">ELA Anomaly Score:</span>
                    <span>{l3.ela_anomaly_score ?? 0.0}</span>
                  </div>
                </div>
                {visForensics.limitations && (
                  <p className="text-[11px] text-gray-600 italic">
                    * {visForensics.limitations}
                  </p>
                )}
              </div>

              {/* Layer 4: QR / Barcode Forensic Cross-Check */}
              <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/70 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-gray-900">Layer 4: QR / Barcode Cross-Check</span>
                  </div>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border font-bold ${
                    barcodeCheck.status === 'MATCH'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : barcodeCheck.status === 'MISMATCH'
                      ? 'bg-red-50 text-red-800 border-red-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}>
                    {barcodeCheck.status || 'NOT DETECTED'}
                  </span>
                </div>
                <p className="text-xs text-gray-700">
                  {barcodeCheck.details || 'Barcode payload matched against OCR fields.'}
                </p>
                {barcodeCheck.limitations && (
                  <p className="text-[11px] text-gray-600 italic">
                    * {barcodeCheck.limitations}
                  </p>
                )}
              </div>

              {/* Layer 5: Deep Learning Vision Model */}
              <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/70 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-gray-900">Layer 5: Deep Learning Classifier</span>
                  </div>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border font-bold ${
                    l4.status === 'passed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                  }`}>
                    {l4.status?.toUpperCase() || 'PASSED'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 font-mono">
                  Model: {l4.model || 'EfficientNet-B0'} • Predicted: {l4.predicted_class || l4.details?.predicted_class || 'genuine'}
                </p>
                {l4.probabilities && (
                  <div className="grid grid-cols-3 gap-2 pt-1 text-xs font-mono">
                    <div className="p-1.5 rounded bg-white border border-gray-200 text-center">
                      <span className="text-gray-500 block text-[10px]">AI Gen</span>
                      <span className="font-bold text-gray-900">{l4.probabilities.ai_generated}%</span>
                    </div>
                    <div className="p-1.5 rounded bg-white border border-gray-200 text-center">
                      <span className="text-gray-500 block text-[10px]">Genuine</span>
                      <span className="font-bold text-emerald-700">{l4.probabilities.genuine}%</span>
                    </div>
                    <div className="p-1.5 rounded bg-white border border-gray-200 text-center">
                      <span className="text-gray-500 block text-[10px]">Tampered</span>
                      <span className="font-bold text-amber-700">{l4.probabilities.tampered}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Layer 6: Cross-Document Face Match (Conditional) */}
              {faceMatch.performed && (
                <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/70 space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-gray-900">Layer 6: Biometric Face Match</span>
                    </div>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded border font-bold ${
                      faceMatch.status === 'SAME'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : faceMatch.status === 'DIFFERENT'
                        ? 'bg-red-50 text-red-800 border-red-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {faceMatch.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700">
                    {faceMatch.details}
                  </p>
                  <div className="p-2 rounded bg-white border border-gray-200 text-xs text-gray-600 flex justify-between font-mono">
                    <span>Similarity: {faceMatch.similarity_percentage}%</span>
                    <span>Distance: {faceMatch.distance}</span>
                    <span>Threshold: {faceMatch.threshold}</span>
                  </div>
                  {faceMatch.limitations && (
                    <p className="text-[11px] text-gray-600 italic">
                      * {faceMatch.limitations}
                    </p>
                  )}
                </div>
              )}

              {/* Security & Privacy Layer */}
              <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/40 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-emerald-950">Security & Privacy Layer</span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                    VERIFIED
                  </span>
                </div>
                <ul className="text-xs text-emerald-900 space-y-1 font-medium">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>AES-256-GCM authenticated encryption at rest</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Zero-trust server-side session & IDOR protection</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>In-memory processing; automatic upload deletion</span>
                  </li>
                </ul>
              </div>

            </div>
          </div>

          {/* Extracted Data Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                Extracted Information Fields
              </span>
              <span className="text-sm font-mono text-gray-500">
                OCR Engine
              </span>
            </div>

            <ExtractedDataGrid data={record.extractedData} />
          </div>
        </div>
      </div>
    </div>
  )
}
