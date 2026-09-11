import React, { useState } from 'react'
import { 
  Eye, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Columns, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react'

export default function DocumentPreview({ 
  documentType, 
  documentName, 
  status, 
  anomalies = [],
  heatmapBase64 = null,
  originalImageUrl = null,
  showHeatmapInitially = true
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
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col shadow-card">
      {/* Top Toolbar */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-bold text-gray-900">Document Visual Evidence</span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-600 font-mono text-sm truncate max-w-[180px]">{documentName}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Selector */}
          <div className="flex bg-white p-0.5 rounded-lg border border-gray-200 shadow-card">
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-semibold transition-colors duration-150 ${
                viewMode === 'side-by-side'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <Columns className="w-4 h-4" />
              <span className="hidden sm:inline">Side-by-Side</span>
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-semibold transition-colors duration-150 ${
                viewMode === 'heatmap'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Grad-CAM Map</span>
            </button>
            <button
              onClick={() => setViewMode('original')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-semibold transition-colors duration-150 ${
                viewMode === 'original'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <span>Original</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-card overflow-hidden text-sm">
            <button
              onClick={handleZoomOut}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-150"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetZoom}
              className="px-2.5 py-1 text-sm text-gray-800 font-mono font-semibold hover:bg-gray-50"
              title="Reset Zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-150"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Document Canvas Display */}
      <div className="relative p-5 bg-gray-50/60 flex items-center justify-center min-h-[320px] overflow-hidden">
        {/* View Mode: SIDE-BY-SIDE */}
        {viewMode === 'side-by-side' && (
          <div 
            style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease-out' }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl z-10"
          >
            {/* Left: Original Document */}
            <div className="rounded-lg bg-white border border-gray-200 overflow-hidden shadow-card flex flex-col">
              <div className="px-3.5 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-sm font-bold text-gray-700">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                  Original Document
                </span>
                <span className="text-sm font-mono text-gray-500">ORIGINAL</span>
              </div>
              <div className="p-3 flex-1 flex items-center justify-center bg-gray-100/50">
                <img 
                  src={originalSrc} 
                  alt="Original Document" 
                  className="w-full h-auto max-h-60 object-contain rounded"
                />
              </div>
            </div>

            {/* Right: Flagged Forensic Heatmap */}
            <div className="rounded-lg bg-white border border-gray-200 overflow-hidden shadow-card flex flex-col relative">
              <div className="px-3.5 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-sm font-bold text-gray-700">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  Grad-CAM Activation Map
                </span>
                <span className={`text-sm font-mono font-bold uppercase ${
                  isGenuine ? 'text-emerald-700' : isSuspicious ? 'text-amber-700' : 'text-red-700'
                }`}>
                  {status}
                </span>
              </div>
              <div className="p-3 flex-1 flex items-center justify-center bg-gray-100/50 relative">
                <img 
                  src={heatmapSrc} 
                  alt="Forensic Heatmap" 
                  className="w-full h-auto max-h-60 object-contain rounded transition-opacity duration-200 opacity-100"
                />
              </div>
            </div>
          </div>
        )}

        {/* View Mode: FULL GRAD-CAM HEATMAP */}
        {viewMode === 'heatmap' && (
          <div 
            style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease-out' }}
            className="w-full max-w-xl rounded-xl bg-white border border-gray-200 overflow-hidden shadow-card z-10"
          >
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-sm font-bold text-gray-900">
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Grad-CAM Heatmap Overlay
              </span>
              <span className="text-sm font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Layer 4
              </span>
            </div>
            <div className="p-4 bg-gray-100/50 flex items-center justify-center">
              <img 
                src={heatmapSrc} 
                alt="Full Forensic Heatmap" 
                className="w-full h-auto max-h-80 object-contain rounded"
              />
            </div>
            <div className="p-3 bg-white border-t border-gray-100 text-sm text-gray-600 text-center">
              Warm regions (red and yellow) highlight areas where anomalies or alterations were detected.
            </div>
          </div>
        )}

        {/* View Mode: ORIGINAL DOCUMENT */}
        {viewMode === 'original' && (
          <div 
            style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease-out' }}
            className="w-full max-w-xl rounded-xl bg-white border border-gray-200 overflow-hidden shadow-card z-10"
          >
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-sm font-bold text-gray-900">
              <span>Original Document Image</span>
              <span className="text-sm font-mono text-gray-500">RAW IMAGE</span>
            </div>
            <div className="p-4 bg-gray-100/50 flex items-center justify-center">
              <img 
                src={originalSrc} 
                alt="Original Document" 
                className="w-full h-auto max-h-80 object-contain rounded"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Legend */}
      <div className="px-4 py-3 bg-white border-t border-gray-200 text-sm flex flex-wrap items-center justify-between gap-2 text-gray-600">
        <div className="flex items-center gap-2">
          {isGenuine ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-emerald-800 font-medium">Uniform compression, clean font baseline, and valid checksums.</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="text-gray-800 font-medium">Warm heatmap clusters identify altered visual regions.</span>
            </>
          )}
        </div>
        <span className="text-sm font-mono text-gray-500 font-semibold">
          DocShield Inspector
        </span>
      </div>
    </div>
  )
}
