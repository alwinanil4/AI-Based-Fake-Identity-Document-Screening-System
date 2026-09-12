import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  CheckCircle2, 
  AlertCircle,
  X,
  FileText,
  Activity,
  Cpu,
  Eye,
  Loader2
} from 'lucide-react'
import DocumentUploader from '../components/verification/DocumentUploader'
import { api } from '../services/api'

export default function VerifyDocument() {
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeStageIndex, setActiveStageIndex] = useState(0)
  const [completedStages, setCompletedStages] = useState([])
  const [scanPreviewUrl, setScanPreviewUrl] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const backendPromiseRef = useRef(null)

  const STAGES = [
    { 
      layer: 'Layer 1', 
      title: 'Device & Behavioral Signals', 
      desc: 'Checks request headers, client environment, and sensor noise consistency.',
      icon: Activity
    },
    { 
      layer: 'Layer 2', 
      title: 'OCR & Text Structure', 
      desc: 'Verifies ICAO check digits, data fields, and typography alignment.',
      icon: FileText
    },
    { 
      layer: 'Layer 3', 
      title: 'Image Forensics', 
      desc: 'Tests for copy-move cloning, JPEG recompression, and frequency anomalies.',
      icon: Eye
    },
    { 
      layer: 'Layer 4', 
      title: 'Deep Learning Model', 
      desc: 'Runs neural network classification and produces Grad-CAM visual evidence.',
      icon: Cpu
    }
  ]

  const handleStartVerification = async (payload) => {
    setErrorMessage('')
    setIsProcessing(true)
    setActiveStageIndex(0)
    setCompletedStages([])
    setScanPreviewUrl(payload.previewUrl || null)

    // Fast, restrained sequence: ~900ms total (within 800ms - 1.2s rule)
    const stageDelays = [220, 220, 220, 240]
    const startTime = Date.now()

    // 1. Dispatch real backend screening call
    const backendPromise = api.screenDocument(payload)
    backendPromiseRef.current = backendPromise

    try {
      // Layer 1
      setActiveStageIndex(0)
      await new Promise(r => setTimeout(r, stageDelays[0]))
      setCompletedStages([0])

      // Layer 2
      setActiveStageIndex(1)
      await new Promise(r => setTimeout(r, stageDelays[1]))
      setCompletedStages([0, 1])

      // Layer 3
      setActiveStageIndex(2)
      await new Promise(r => setTimeout(r, stageDelays[2]))
      setCompletedStages([0, 1, 2])

      // Layer 4 (Wait for backend response)
      setActiveStageIndex(3)
      const result = await backendPromise

      const elapsed = Date.now() - startTime
      if (elapsed < 900) {
        await new Promise(r => setTimeout(r, 900 - elapsed))
      }

      setCompletedStages([0, 1, 2, 3])

      // Immediate transition (180ms) — pass result in router state to avoid
      // a second IDOR-gated /api/scan fetch before the session cookie settles
      setTimeout(() => {
        navigate(`/results/${result.id}`, { state: { scanResult: result } })
      }, 180)
    } catch (err) {
      setIsProcessing(false)
      setErrorMessage(err.message || 'Screening engine encountered an error. Please verify backend is running.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Document Verification
            </h1>
            <span className="text-sm px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold font-mono">
              SIH26188
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Upload an official identity card to run 4-layer screening.
          </p>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-start justify-between gap-3 text-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900">Verification Notice</p>
              <p className="text-red-800 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button 
            onClick={() => setErrorMessage('')} 
            className="text-red-500 hover:text-red-800 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Content Area: Scanning Progress OR Uploader */}
      {isProcessing ? (
        <div className="p-6 sm:p-8 rounded-xl bg-white border border-gray-200 shadow-card space-y-6">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Analyzing Document</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Running 4-Layer Inspection
            </h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Screening metadata, document structure, pixel forensics, and neural network predictions.
            </p>
          </div>

          {/* Clean Document Preview without flashy laser beam */}
          <div className="max-w-xs mx-auto h-52 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center p-3 shadow-card">
            {scanPreviewUrl ? (
              <img
                src={scanPreviewUrl}
                alt="Document Under Analysis"
                className="max-h-full max-w-full object-contain rounded-md"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                <FileText className="w-10 h-10 text-gray-400" />
                <span className="text-sm font-mono">Document Image</span>
              </div>
            )}
          </div>

          {/* 4-Layer Clean Progress Indicators */}
          <div className="space-y-3 max-w-xl mx-auto">
            {STAGES.map((stage, idx) => {
              const isDone = completedStages.includes(idx)
              const isActive = activeStageIndex === idx && !isDone
              const Icon = stage.icon

              return (
                <div
                  key={stage.layer}
                  className={`p-3.5 rounded-lg border transition-colors duration-150 flex items-start gap-3.5 ${
                    isActive
                      ? 'bg-blue-50/70 border-blue-400'
                      : isDone
                      ? 'bg-white border-gray-200'
                      : 'bg-gray-50/70 border-gray-200 opacity-60'
                  }`}
                >
                  {/* Status Indicator */}
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : isActive ? (
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-sm text-gray-400 font-mono font-bold">
                        {idx + 1}
                      </div>
                    )}
                  </div>

                  {/* Stage Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-gray-900">
                        {stage.title}
                      </span>
                      <span className="text-sm font-mono text-gray-500 font-medium">
                        {stage.layer}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5 leading-normal">
                      {stage.desc}
                    </p>

                    {/* Clean thin progress bar when active */}
                    {isActive && (
                      <div className="w-full h-1 rounded-full bg-blue-100 overflow-hidden mt-2">
                        <div className="h-full bg-blue-600 rounded-full w-2/3 transition-all duration-200" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <DocumentUploader
          onStartVerification={handleStartVerification}
          isProcessing={isProcessing}
        />
      )}
    </div>
  )
}
