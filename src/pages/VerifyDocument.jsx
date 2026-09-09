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
    { title: 'Optical Character Recognition', desc: 'Parsing text, font kerning, and baseline typography' },
    { title: 'Biometric Face & Aspect Ratio Match', desc: 'Analyzing portrait symmetry, resolution, and GAN artifacts' },
    { title: 'Physical Security & Watermark Inspection', desc: 'Verifying Ashoka emblem, holographic reflectance, and guilloche' },
    { title: 'Tampering & Algorithmic Checksum Validation', desc: 'Performing Error Level Analysis (ELA) and Verhoeff/MoRTH checks' }
  ]

  const handleStartVerification = async (payload) => {
    setIsProcessing(true)
    setCurrentStepIndex(0)

    // Progress through visual steps during the simulated AI backend call
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < SCAN_STAGES.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 550)

    try {
      const result = await api.screenDocument(payload)
      clearInterval(stepInterval)
      // Navigate to the comprehensive verification result page
      navigate(`/results/${result.id}`)
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
              AI Identity Screening Terminal
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-semibold">
              Live Inspection
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Upload an Aadhaar, PAN, Voter ID, Driving License, or Passport to detect tampering, text alteration, or synthetic forgery.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Checkpoint Security Encrypted</span>
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0d1322] border border-blue-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            {/* Animated Laser Scanner Line */}
            <div className="scanner-laser" />

            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mx-auto mb-3 shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-pulse">
                <Scan className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                AI Vision Screening in Progress
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Executing multi-vector deep learning forensic model
              </p>
            </div>

            {/* Stepper Progress */}
            <div className="space-y-3.5 mb-6">
              {SCAN_STAGES.map((stage, idx) => {
                const isCompleted = idx < currentStepIndex
                const isCurrent = idx === currentStepIndex
                return (
                  <div
                    key={stage.title}
                    className={`p-3 rounded-lg border transition-all flex items-start gap-3 ${
                      isCurrent
                        ? 'bg-blue-600/15 border-blue-500/50 text-white'
                        : isCompleted
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-300'
                        : 'bg-slate-900/40 border-slate-800/60 text-slate-500'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : isCurrent ? (
                        <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-700" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{stage.title}</span>
                        {isCurrent && (
                          <span className="text-[10px] text-blue-400 font-mono animate-pulse">
                            Processing...
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-[10px] text-emerald-400 font-mono">
                            Done
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{stage.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="text-center text-[11px] text-slate-500 font-mono">
              Confidence threshold: 95.0% • SIH Model Pipeline
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
