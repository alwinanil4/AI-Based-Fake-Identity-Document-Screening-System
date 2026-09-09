import React, { useState } from 'react'
import { Eye, ZoomIn, ZoomOut, AlertCircle, Layers, CheckCircle2 } from 'lucide-react'

export default function DocumentPreview({ documentType, documentName, status, anomalies = [] }) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [showHeatmap, setShowHeatmap] = useState(true)

  const isSuspicious = status === 'suspicious'
  const isFake = status === 'fake' || status === 'fraudulent'

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2))
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75))
  const resetZoom = () => setZoomLevel(1)

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1322] overflow-hidden flex flex-col">
      {/* Top Toolbar */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-slate-200">Forensic Document Inspector</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 font-mono text-[11px] truncate max-w-[180px]">{documentName}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Heatmap Layer Toggle */}
          {(isSuspicious || isFake) && (
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
                showHeatmap
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{showHeatmap ? 'Tamper Overlay: Active' : 'Tamper Overlay: Off'}</span>
            </button>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-800/80 rounded border border-slate-700/60 overflow-hidden">
            <button
              onClick={handleZoomOut}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
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
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Document Canvas Display */}
      <div className="relative p-6 bg-slate-950 flex items-center justify-center min-h-[320px] overflow-hidden">
        {/* Background Grid for inspection feel */}
        <div 
          className="absolute inset-0 opacity-10" 
          style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '16px 16px' }}
        />

        {/* The Document Visual Representation */}
        <div
          style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease-out' }}
          className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl border border-slate-700 shadow-2xl p-5 text-slate-100 overflow-hidden select-none"
        >
          {/* Header of Simulated ID */}
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-[10px] font-bold text-blue-300">
                IN
              </div>
              <div>
                <p className="text-[11px] font-bold tracking-wider text-slate-200 uppercase">
                  {documentType || 'National Identity Card'}
                </p>
                <p className="text-[9px] text-slate-400">Government of India / Statutory Authority</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-blue-400 font-semibold">SECURE-ID</span>
            </div>
          </div>

          {/* Main Card Body */}
          <div className="flex gap-4 items-start">
            {/* Portrait Box */}
            <div className="relative w-24 h-28 rounded-lg bg-slate-800 border border-slate-700 flex flex-col items-center justify-center shrink-0 overflow-hidden">
              <div className="w-12 h-12 rounded-full bg-slate-700/80 border border-slate-600 mb-1 flex items-center justify-center text-xs text-slate-400">
                PHOTO
              </div>
              <span className="text-[9px] text-slate-400 font-mono">BIOMETRIC</span>

              {/* Fake AI Portrait Bounding Box overlay */}
              {showHeatmap && isFake && (
                <div className="absolute inset-0 bg-rose-600/30 border-2 border-rose-500 flex flex-col justify-end p-1 animate-pulse">
                  <span className="text-[8px] bg-rose-900/90 text-rose-200 font-bold px-1 rounded">
                    GAN / Spoof
                  </span>
                </div>
              )}
            </div>

            {/* Document Content Fields */}
            <div className="flex-1 space-y-2 text-left">
              <div>
                <span className="text-[9px] text-slate-400 block uppercase">Name / Holder</span>
                <span className="text-xs font-semibold text-slate-100 font-mono">CITIZEN RECORD</span>
              </div>

              {/* DOB field with Suspicious Tamper Bounding Box */}
              <div className="relative">
                <span className="text-[9px] text-slate-400 block uppercase">Date of Birth / Gender</span>
                <span className="text-xs font-mono text-slate-200">19/08/1988 • M</span>

                {showHeatmap && isSuspicious && (
                  <div className="absolute -inset-1 border-2 border-amber-500 bg-amber-500/20 rounded px-1 flex items-center justify-between">
                    <span className="text-[8px] font-bold text-amber-300">ELA Noise: Altered Font</span>
                    <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                  </div>
                )}
              </div>

              <div>
                <span className="text-[9px] text-slate-400 block uppercase">Identification Serial</span>
                <span className="text-xs font-mono text-blue-300 font-semibold tracking-wider">
                  XXXX-XXXX-8392
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Security Hologram & Barcode */}
          <div className="mt-4 pt-3 border-t border-slate-700/80 flex items-center justify-between relative">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500/40 to-yellow-300/40 border border-yellow-500/60 flex items-center justify-center text-[8px] font-bold text-amber-300">
                HOL
              </div>
              <span className="text-[9px] font-mono text-slate-400">UV-MICROPRINT OK</span>
            </div>

            {showHeatmap && isFake && (
              <div className="absolute right-0 top-2 border border-rose-500 bg-rose-950/80 px-2 py-0.5 rounded text-[8px] text-rose-300 font-semibold flex items-center gap-1">
                <AlertCircle className="w-2.5 h-2.5 text-rose-400" />
                <span>Hologram Absent</span>
              </div>
            )}

            <div className="font-mono text-[9px] text-slate-500 tracking-widest">
              ||||| ||| |||||| ||||
            </div>
          </div>
        </div>
      </div>

      {/* Forensic Inspection Footer Summary */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isSuspicious ? (
            <>
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 font-medium">1 Forensic Tamper Zone Flagged</span>
            </>
          ) : isFake ? (
            <>
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span className="text-rose-300 font-medium">3 Critical Counterfeit Violations Flagged</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Zero Digital Alterations Detected</span>
            </>
          )}
        </div>
        <span className="text-[11px] text-slate-500">Dual-Stream Neural Model v2.4</span>
      </div>
    </div>
  )
}
