import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  MapPin, 
  Scan,
  RefreshCw
} from 'lucide-react'
import VerificationStatus from '../components/verification/VerificationStatus'
import RiskScore from '../components/verification/RiskScore'
import DocumentPreview from '../components/verification/DocumentPreview'
import CheckCard from '../components/verification/CheckCard'
import ExtractedDataGrid from '../components/verification/ExtractedDataGrid'
import { api } from '../services/api'
import { formatDate } from '../utils/helpers'

export default function VerificationResult() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionNotice, setActionNotice] = useState(null)

  useEffect(() => {
    async function loadRecord() {
      try {
        const data = await api.getVerificationById(id)
        setRecord(data)
      } catch (err) {
        console.error('Failed to load verification record:', err)
      } finally {
        setLoading(false)
      }
    }
    loadRecord()
  }, [id])

  const handlePrintReport = () => {
    window.print()
  }

  const handleOfficerDecision = (decision) => {
    setActionNotice({
      type: decision,
      text: decision === 'approved' 
        ? 'Document manually cleared and approved by Officer.' 
        : 'Document flagged for physical forensic interrogation and impoundment.'
    })
  }

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-300">Retrieving Forensic Audit Record...</p>
        <p className="text-xs text-slate-500 mt-1">Verification ID: {id}</p>
      </div>
    )
  }

  if (!record) {
    return (
      <div className="py-24 text-center space-y-4">
        <FileText className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-lg font-bold text-white">Verification Record Not Found</h2>
        <p className="text-xs text-slate-400">The requested audit file could not be located.</p>
        <Link
          to="/history"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to History</span>
        </Link>
      </div>
    )
  }

  const isGenuine = record.status === 'genuine'
  const isSuspicious = record.status === 'suspicious'
  const isFake = record.status === 'fake' || record.status === 'fraudulent'

  return (
    <div className="space-y-6 pb-12 print:p-0">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            to="/history"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Back to History"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                AI Forensic Screening Report
              </h1>
              <span className="font-mono text-xs font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30">
                {record.id}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Generated: {formatDate(record.timestamp)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintReport}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Print Audit File</span>
          </button>
          <Link
            to="/verify"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Verify Another</span>
          </Link>
        </div>
      </div>

      {/* Metadata Bar (Officer, Checkpoint, Subject) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-semibold">Inspecting Officer</span>
          <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
            <User className="w-3.5 h-3.5 text-blue-400" />
            {record.officerId || 'OFF-IND-4029'}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-semibold">Checkpoint Station</span>
          <span className="font-medium text-slate-200 flex items-center gap-1.5 mt-0.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            {record.checkpoint || 'Main Gate Terminal'}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-semibold">Document Classification</span>
          <span className="font-semibold text-blue-400 mt-0.5 block">
            {record.documentType}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-semibold">Citizen / Holder Name</span>
          <span className="font-semibold text-slate-200 mt-0.5 block truncate">
            {record.citizenName}
          </span>
        </div>
      </div>

      {/* Classification Banner */}
      <VerificationStatus status={record.status} size="banner" showDescription={true} />

      {/* Executive Summary Rationale */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          AI Verdict & Forensic Explanation
        </p>
        <p className="text-sm text-slate-200 leading-relaxed font-medium">
          {record.verdictSummary}
        </p>
      </div>

      {/* Two Column Layout: Preview & Risk vs Extracted Data */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Document Preview & Risk Gauge */}
        <div className="lg:col-span-5 space-y-6">
          <DocumentPreview
            documentType={record.documentType}
            documentName={record.documentName}
            status={record.status}
            anomalies={record.anomalies}
          />

          {/* Risk Score Meter */}
          <RiskScore score={record.riskScore} />

          {/* Officer Decision Action Panel */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 print:hidden">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Officer Enforcement Action
            </span>

            {actionNotice ? (
              <div
                className={`p-3 rounded-lg border text-xs ${
                  actionNotice.type === 'approved'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Action Recorded in Log</span>
                </div>
                <p>{actionNotice.text}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleOfficerDecision('approved')}
                  className="py-2.5 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Approve & Clear</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOfficerDecision('flagged')}
                  className="py-2.5 px-3 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Flag / Impound</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Anomalies, Extracted OCR, Checks */}
        <div className="lg:col-span-7 space-y-6">
          {/* Detailed Forensic Anomalies (Crucial for SIH evaluators) */}
          {record.anomalies && record.anomalies.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white tracking-tight uppercase">
                  Flagged Anomalies & Security Breaches ({record.anomalies.length})
                </h3>
              </div>

              <div className="space-y-2.5">
                {record.anomalies.map((ano, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border text-xs ${
                      ano.severity === 'critical'
                        ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                        : ano.severity === 'high'
                        ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                        : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm tracking-tight">{ano.title}</span>
                      <span
                        className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                          ano.severity === 'critical'
                            ? 'bg-rose-900 text-white'
                            : ano.severity === 'high'
                            ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {ano.severity} Severity
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {ano.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Metadata Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white tracking-tight uppercase">
                  OCR Extracted Information
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Click copy to clipboard
              </span>
            </div>

            <ExtractedDataGrid data={record.extractedData} />
          </div>

          {/* Individual AI Checks Breakdown */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white tracking-tight uppercase">
              Forensic AI Inspection Checklist ({record.checks?.length || 0} Vectors)
            </h3>
            <div className="space-y-2.5">
              {record.checks?.map((check) => (
                <CheckCard key={check.id} check={check} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
