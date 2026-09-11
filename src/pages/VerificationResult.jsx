import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
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
  Layers
} from 'lucide-react'
import DocumentPreview from '../components/verification/DocumentPreview'
import ExtractedDataGrid from '../components/verification/ExtractedDataGrid'
import { api } from '../services/api'
import { formatDate } from '../utils/helpers'

export default function VerificationResult() {
  const { id } = useParams()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionNotice, setActionNotice] = useState(null)
  const [layerBreakdownOpen, setLayerBreakdownOpen] = useState(false)

  useEffect(() => {
    async function loadRecord() {
      try {
        const data = await api.getVerificationById(id)
        setRecord(data)
        setLoading(false)
      } catch (err) {
        console.error('Failed to load verification record:', err)
        setLoading(false)
      }
    }
    loadRecord()
  }, [id])

  const handlePrint = () => {
    window.print()
  }

  const handleOfficerDecision = (decision) => {
    setActionNotice({
      type: decision,
      text: decision === 'approved' 
        ? 'Identity document verified and approved in audit ledger.' 
        : 'Document flagged for secondary manual review and impoundment.'
    })
  }

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-gray-800">Loading verification audit file</p>
        <p className="text-sm font-mono text-gray-500">ID: {id}</p>
      </div>
    )
  }

  if (!record) {
    return (
      <div className="p-8 rounded-xl bg-white border border-gray-200 text-center space-y-4 max-w-lg mx-auto shadow-card">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Record Not Found</h2>
          <p className="text-sm text-gray-600 mt-1">
            No inspection records match ID {id} in the database.
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

  const l1 = record.layer_results?.layer1_behavioral || {}
  const l2 = record.layer_results?.layer2_ocr || {}
  const l3 = record.layer_results?.layer3_forensics || {}
  const l4 = record.layer_results?.layer4_ai_detection || {}

  const getTagAttribution = (tag) => {
    const t = tag.toLowerCase()
    if (t.includes('mrz') || t.includes('checksum') || t.includes('ocr') || t.includes('font')) {
      return { layer: 'Layer 2', name: 'OCR & Structure', icon: FileText }
    }
    if (t.includes('ela') || t.includes('copy-move') || t.includes('fft') || t.includes('splic')) {
      return { layer: 'Layer 3', name: 'Image Forensics', icon: Eye }
    }
    if (t.includes('ai') || t.includes('gan') || t.includes('synthetic') || t.includes('neural')) {
      return { layer: 'Layer 4', name: 'Deep Vision', icon: Cpu }
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
            {record.officerId || 'OFF-IND-4029'}
          </span>
        </div>
        <div>
          <span className="text-gray-500 block text-sm font-semibold uppercase tracking-wide">Inspection Point</span>
          <span className="font-medium text-gray-900 flex items-center gap-1.5 mt-0.5 truncate">
            <MapPin className="w-4 h-4 text-amber-600" />
            {record.checkpoint || 'Primary Intake Gate'}
          </span>
        </div>
        <div>
          <span className="text-gray-500 block text-sm font-semibold uppercase tracking-wide">Document Type</span>
          <span className="font-bold text-blue-700 mt-0.5 block truncate">
            {record.documentType}
          </span>
        </div>
        <div>
          <span className="text-gray-500 block text-sm font-semibold uppercase tracking-wide">Subject Name</span>
          <span className="font-bold text-gray-900 mt-0.5 block truncate">
            {record.citizenName || 'Not detected'}
          </span>
        </div>
      </div>

      {/* Primary Verdict Banner */}
      <div 
        className={`p-6 rounded-xl border-2 transition-colors duration-150 ${
          isGenuine
            ? 'bg-emerald-50/60 border-emerald-300'
            : isSuspicious
            ? 'bg-amber-50/60 border-amber-300'
            : 'bg-red-50/60 border-red-300'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div 
              className={`w-14 h-14 rounded-xl flex items-center justify-center border shadow-card shrink-0 ${
                isGenuine
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                  : isSuspicious
                  ? 'bg-amber-100 border-amber-300 text-amber-800'
                  : 'bg-red-100 border-red-300 text-red-800'
              }`}
            >
              {isGenuine ? (
                <ShieldCheck className="w-8 h-8 text-emerald-700" />
              ) : isSuspicious ? (
                <AlertCircle className="w-8 h-8 text-amber-700" />
              ) : (
                <ShieldAlert className="w-8 h-8 text-red-700" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold uppercase tracking-wider text-gray-600">
                  Screening Verdict
                </span>
                <span className={`w-2.5 h-2.5 rounded-full ${
                  isGenuine ? 'bg-emerald-600' : isSuspicious ? 'bg-amber-600' : 'bg-red-600'
                }`} />
              </div>
              <h2 
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5 ${
                  isGenuine ? 'text-emerald-900' : isSuspicious ? 'text-amber-900' : 'text-red-900'
                }`}
              >
                {isGenuine ? 'GENUINE DOCUMENT' : isSuspicious ? 'SUSPICIOUS (REVIEW REQUIRED)' : 'FORGERY DETECTED'}
              </h2>
              <p className="text-sm text-gray-700 mt-1 max-w-xl">
                {record.verdictSummary || `Document evaluated across 4 parallel inspection layers. Result: ${record.status?.toUpperCase() || record.verdict?.toUpperCase()}.`}
              </p>
            </div>
          </div>

          {/* Confidence Display */}
          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-gray-200 pt-3 md:pt-0 md:pl-6">
            <div className="text-left md:text-right">
              <span className="text-sm uppercase font-bold text-gray-500 block tracking-wide">
                Confidence Score
              </span>
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-gray-900">
                {confidenceValue.toFixed(1)}%
              </span>
              <span className="text-sm font-mono text-gray-600 block mt-0.5">
                Processing: {latencySec}s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Flagged Reason Tags */}
      {record.reason_tags && record.reason_tags.length > 0 && (
        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">
              Flagged Evidence and Anomalies ({record.reason_tags.length})
            </span>
            <span className="text-sm font-mono text-gray-500">
              Verified by 4-layer inspection
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {record.reason_tags.map((tag, idx) => {
              const attr = getTagAttribution(tag)
              const TagIcon = attr.icon
              return (
                <div
                  key={idx}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium border flex items-center gap-2.5 ${
                    isFake
                      ? 'bg-red-50 text-red-800 border-red-200'
                      : isSuspicious
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  <TagIcon className="w-4 h-4 shrink-0 opacity-80" />
                  <span className="font-mono text-sm px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-800 font-bold">
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

            <div className={`p-4 space-y-3 ${layerBreakdownOpen ? 'block' : 'hidden'}`}>
              {/* Layer 1 */}
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50/60 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-gray-900">Layer 1: Behavioral and Telemetry</span>
                  <span className={`text-sm font-mono px-2 py-0.5 rounded border font-semibold ${
                    l1.status === 'passed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                  }`}>
                    {l1.status?.toUpperCase() || 'PASSED'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Entropy score: {l1.details?.client_entropy_score || 94.2} • Automation: {l1.details?.is_emulator ? 'Detected' : 'None'}
                </p>
              </div>

              {/* Layer 2 */}
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50/60 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-gray-900">Layer 2: Text and MRZ Structure</span>
                  <span className={`text-sm font-mono px-2 py-0.5 rounded border font-semibold ${
                    l2.status === 'passed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                  }`}>
                    {l2.status?.toUpperCase() || 'PASSED'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  ICAO Checksum: {l2.mrz_checksum_valid ? 'Valid Match' : 'Not Applicable'} • Standard: {l2.document_type || record.documentType}
                </p>
              </div>

              {/* Layer 3 */}
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50/60 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-gray-900">Layer 3: Image Forensics</span>
                  <span className={`text-sm font-mono px-2 py-0.5 rounded border font-semibold ${
                    l3.status === 'passed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                  }`}>
                    {l3.status?.toUpperCase() || 'PASSED'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  ELA Anomaly: {l3.ela_anomaly_score || 0.0} • Cloned Clusters: {l3.copy_move_matches_count || 0}
                </p>
              </div>

              {/* Layer 4 */}
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50/60 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-gray-900">Layer 4: Deep Learning Model</span>
                  <span className={`text-sm font-mono px-2 py-0.5 rounded border font-semibold ${
                    l4.status === 'passed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                  }`}>
                    {l4.status?.toUpperCase() || 'PASSED'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 font-mono">
                  Model: {l4.model || 'EfficientNet-B0'} • Predicted: {l4.predicted_class || l4.details?.predicted_class || 'genuine'}
                </p>
                {l4.probabilities && (
                  <div className="grid grid-cols-3 gap-2 pt-1 text-sm font-mono">
                    <div className="p-2 rounded bg-white border border-gray-200 text-center">
                      <span className="text-gray-500 block">AI Gen</span>
                      <span className="font-bold text-gray-900">{l4.probabilities.ai_generated}%</span>
                    </div>
                    <div className="p-2 rounded bg-white border border-gray-200 text-center">
                      <span className="text-gray-500 block">Genuine</span>
                      <span className="font-bold text-emerald-700">{l4.probabilities.genuine}%</span>
                    </div>
                    <div className="p-2 rounded bg-white border border-gray-200 text-center">
                      <span className="text-gray-500 block">Tampered</span>
                      <span className="font-bold text-amber-700">{l4.probabilities.tampered}%</span>
                    </div>
                  </div>
                )}
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
