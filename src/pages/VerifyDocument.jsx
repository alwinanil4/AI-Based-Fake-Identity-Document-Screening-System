import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Shield, 
  Cpu, 
  Scan, 
  CheckCircle2, 
  Sparkles, 
  Info,
  Layers,
  FileSearch,
  SearchCheck
} from 'lucide-react'
import DocumentUploader from '../components/verification/DocumentUploader'
import { api } from '../services/api'

export default function VerifyDocument() {
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const SCAN_STAGES = [
    { 
      layer: 'Layer 1', 
      title: 'Behavioral & Device Signals', 
      desc: 'Checking EXIF camera metadata, client telemetry, and sensor noise entropy',
      color: 'border-cyan-500/40 text-cyan-400'
    },
    { 
      layer: 'Layer 2', 
      title: 'OCR & Structural Validation', 
      desc: 'Tesseract OCR text parsing, ICAO 7-3-1 check digits, and typographic baseline alignment',
      color: 'border-emerald-500/40 text-emerald-400'
    },
    { 
      layer: 'Layer 3', 
      title: 'Image Forensics Engine', 
      desc: 'Error Level Analysis (ELA), ORB copy-move clone detection, and 2D FFT spectral analysis',
      color: 'border-amber-500/40 text-amber-400'
    },
    { 
      layer: 'Layer 4', 
      title: 'AI / Deep Learning Detection', 
      desc: 'Deep convolutional feature maps and Grad-CAM explainable heatmap localization',
      color: 'border-purple-500/40 text-purple-400'
    }
  ]

  const handleStartVerification = async (payload) => {
    setIsProcessing(true)
    setCurrentStepIndex(0)

    // Progress through visual steps during the parallel AI backend call
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < SCAN_STAGES.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 600)

    try {
      const result = await api.screenDocument(payload)
      setCurrentStepIndex(SCAN_STAGES.length - 1)
      clearInterval(stepInterval)
      // Small pause to let user see all 4 layers completed
      setTimeout(() => {
        navigate(`/results/${result.id}`)
      }, 400)
    } catch (err) {
      clearInterval(stepInterval)
      console.error('Screening failed:', err)
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              DocShield AI — Multi-Layer Document Screening
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-semibold">
              SIH 2026 Live Terminal
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Parallel behavioral, structural, forensic, and AI vision inspection for Indian identity documents.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Parallel 4-Layer Execution</span>
        </div>
      </div>

      {/* Main Uploader Form */}
      <DocumentUploader
        onStartVerification={handleStartVerification}
        isProcessing={isProcessing}
        scanningStage={SCAN_STAGES[currentStepIndex]?.title}
      />

      {/* Active AI Processing Stepper Modal Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0d1322] border border-blue-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Animated Laser Scanner Line */}
            <div className="scanner-laser" />

            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mx-auto mb-3 shadow-[0_0_25px_rgba(59,130,246,0.35)] animate-pulse">
                <Scan className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Parallel Multi-Layer Inspection
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Executing Layers 1–4 concurrently across hardware threads
              </p>
            </div>

            {/* Stepper Progress */}
            <div className="space-y-3 mb-6">
              {SCAN_STAGES.map((stage, idx) => {
                const isCompleted = idx < currentStepIndex
                const isCurrent = idx === currentStepIndex
                return (
                  <div
                    key={stage.layer}
                    className={`p-3 rounded-xl border transition-all flex items-start gap-3.5 ${
                      isCurrent
                        ? 'bg-blue-600/15 border-blue-500/60 text-white shadow-md shadow-blue-500/10'
                        : isCompleted
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                        : 'bg-slate-900/30 border-slate-800/60 text-slate-500'
                    }`}
                  >
                    <div className="mt-1">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : isCurrent ? (
                        <div className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center text-[10px] text-slate-600 font-bold">
                          {idx + 1}
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${stage.color} bg-black/40 font-mono`}>
                            {stage.layer}
                          </span>
                          <span className="text-xs font-bold">{stage.title}</span>
                        </div>
                        {isCurrent && (
                          <span className="text-[10px] text-blue-400 font-mono font-semibold animate-pulse">
                            Analyzing...
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                            <span>Completed</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{stage.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Live Progress Bar */}
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mb-3 border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-teal-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round(((currentStepIndex + 1) / SCAN_STAGES.length) * 100))}%` }}
              />
            </div>

            <p className="text-center text-[11px] text-slate-500 font-mono">
              Aggregating outputs via deterministic forensic veto logic
            </p>
          </div>
        </div>
      )}


      {/* Verification Guidelines / Help for Officers */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <Info className="w-4 h-4 text-blue-400" />
          <span>Officer Verification Standard Operating Procedure (SOP)</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1 text-[11px]">
          <li>Ensure document scan resolution is at least 300 DPI for micro-print integrity analysis.</li>
          <li>For suspicious classification, cross-reference the Error Level Analysis (ELA) heatmap before taking enforcement action.</li>
          <li>In case of a fake classification, the system automatically creates an encrypted tamper audit record.</li>
        </ul>
      </div>
    </div>
  )
}
