import React, { useState } from 'react'
import { 
  Eye, 
  ZoomIn, 
  ZoomOut, 
  AlertCircle, 
  Layers, 
  CheckCircle2, 
  Columns, 
  Sparkles,
  Maximize2
} from 'lucide-react'

export default function DocumentPreview({ 
  documentType, 
  documentName, 
  status, 
  anomalies = [],
  heatmapBase64 = null,
  originalImageUrl = null
}) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [viewMode, setViewMode] = useState('side-by-side') // 'side-by-side' | 'heatmap' | 'original'

  const isSuspicious = status?.toLowerCase() === 'suspicious'
  const isFake = status?.toLowerCase() === 'fake' || status?.toLowerCase() === 'fraudulent'
  const isGenuine = status?.toLowerCase() === 'genuine'

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2))
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75))
  const resetZoom = () => setZoomLevel(1)

  // Resolve document image source fallback
  const getDisplayImage = (isHeatmap = false) => {
    if (isHeatmap && heatmapBase64) {
      return heatmapBase64
    }
    if (originalImageUrl) {
      return originalImageUrl
    }
    // Fallback to pre-rendered sample documents based on document name or type
    const lower = (documentName || documentType || '').toLowerCase()
    if (lower.includes('passport')) return '/sample_documents/sample_genuine_passport.png'
    if (lower.includes('aadhaar')) return '/sample_documents/sample_forged_aadhaar_dob_tamper.jpg'
    if (lower.includes('pan')) return '/sample_documents/sample_cloned_pan_card.png'
    if (lower.includes('voter') || lower.includes('epic')) return '/sample_documents/sample_spliced_voter_id.jpg'
    return '/sample_documents/sample_genuine_passport.png'
  }

  const originalSrc = getDisplayImage(false)
  const heatmapSrc = heatmapBase64 || getDisplayImage(true)

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0d1322] overflow-hidden flex flex-col shadow-xl">
      {/* Top Toolbar */}
      <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="font-bold text-slate-200">Forensic Vision Inspector</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono text-[11px] truncate max-w-[160px]">{documentName}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Selector */}
          <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                viewMode === 'side-by-side'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Side-by-Side</span>
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                viewMode === 'heatmap'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Forensic Heatmap</span>
            </button>
            <button
              onClick={() => setViewMode('original')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                viewMode === 'original'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Original</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-800/80 rounded-lg border border-slate-700/60 overflow-hidden">
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetZoom}
              className="px-2 py-1 text-[10px] text-slate-300 font-mono hover:bg-slate-700/60"
              title="Reset Zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Document Canvas Display */}
      <div className="relative p-4 sm:p-6 bg-slate-950/80 flex items-center justify-center min-h-[360px] overflow-hidden">
        {/* Background Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-15" 
          style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '16px 16px' }}
        />

        {/* View Mode: SIDE-BY-SIDE */}
        {viewMode === 'side-by-side' && (
          <div 
            style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease-out' }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl z-10"
          >
            {/* Left: Original Document */}
            <div className="rounded-xl bg-slate-900/90 border border-slate-700/80 overflow-hidden shadow-lg flex flex-col">
              <div className="px-3 py-2 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between text-[11px] font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Original Document
                </span>
                <span className="text-[10px] font-mono text-slate-400">INPUT CROP</span>
              </div>
              <div className="p-2 flex-1 flex items-center justify-center bg-black/40">
                <img 
                  src={originalSrc} 
                  alt="Original Document" 
                  className="w-full h-auto max-h-64 object-contain rounded-lg shadow"
                />
              </div>
            </div>

            {/* Right: Flagged Forensic Heatmap */}
            <div className="rounded-xl bg-slate-900/90 border border-rose-500/40 overflow-hidden shadow-lg flex flex-col relative">
              <div className="px-3 py-2 bg-rose-950/40 border-b border-rose-500/40 flex items-center justify-between text-[11px] font-bold text-rose-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                  Flagged Anomalies Heatmap
                </span>
                <span className="text-[10px] font-mono uppercase text-rose-300">
                  {status}
                </span>
              </div>
              <div className="p-2 flex-1 flex items-center justify-center bg-black/40 relative group">
                <img 
                  src={heatmapSrc} 
                  alt="Forensic Heatmap" 
                  className="w-full h-auto max-h-64 object-contain rounded-lg shadow filter contrast-105"
                />
                <div className="absolute bottom-3 left-3 right-3 p-1.5 rounded bg-black/75 backdrop-blur-sm border border-slate-700/60 text-[10px] text-slate-300 text-center pointer-events-none">
                  <span className="text-amber-300 font-semibold">Heatmap Legend:</span> Red/Yellow = High Tamper Spikes • Blue = Unaltered
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Mode: FULL FORENSIC HEATMAP */}
        {viewMode === 'heatmap' && (
          <div 
            style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease-out' }}
            className="w-full max-w-xl rounded-xl bg-slate-900/90 border border-rose-500/50 overflow-hidden shadow-2xl z-10"
          >
            <div className="px-3.5 py-2 bg-rose-950/50 border-b border-rose-500/40 flex items-center justify-between text-xs font-bold text-rose-300">
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-rose-400 animate-pulse" />
                Grad-CAM & ELA Forensic Heatmap Overlay
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-200 border border-rose-500/40">
                Active Anomaly Map
              </span>
            </div>
            <div className="p-3 bg-black/50 flex items-center justify-center">
              <img 
                src={heatmapSrc} 
                alt="Full Forensic Heatmap" 
                className="w-full h-auto max-h-96 object-contain rounded-lg"
              />
            </div>
            <div className="p-2 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 text-center">
              High-intensity warm regions (red, orange, yellow) pinpoint pixel-level digital tampering and compression edits.
            </div>
          </div>
        )}

        {/* View Mode: ORIGINAL DOCUMENT ONLY */}
        {viewMode === 'original' && (
          <div 
            style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease-out' }}
            className="w-full max-w-xl rounded-xl bg-slate-900/90 border border-slate-700 overflow-hidden shadow-2xl z-10"
          >
            <div className="px-3.5 py-2 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between text-xs font-bold text-slate-200">
              <span>Original Document Scan</span>
              <span className="text-[10px] font-mono text-slate-400">UNALTERED IMAGE</span>
            </div>
            <div className="p-3 bg-black/50 flex items-center justify-center">
              <img 
                src={originalSrc} 
                alt="Original Document" 
                className="w-full h-auto max-h-96 object-contain rounded-lg"
              />
            </div>
          </div>
        )}
      </div>

      {/* Forensic Inspection Footer Summary */}
      <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isSuspicious ? (
            <>
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-amber-300 font-medium">Forensic Inconsistencies Flagged for Officer Inspection</span>
            </>
          ) : isFake ? (
            <>
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="text-rose-300 font-medium">Critical Forgery Detected Across Analysis Layers</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-emerald-400 font-medium">Zero Digital Alterations or Checksum Inconsistencies Detected</span>
            </>
          )}
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          DocShield AI Multi-Layer Forensic Engine
        </span>
      </div>
    </div>
  )
}
