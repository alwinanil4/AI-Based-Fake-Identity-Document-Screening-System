import React, { useState, useRef } from 'react'
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  Sparkles, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react'
import { DEMO_PRESETS } from '../../services/api'
import { formatBytes } from '../../utils/helpers'

const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default function DocumentUploader({ onStartVerification, isProcessing, scanningStage }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [selectedDocType, setSelectedDocType] = useState('Auto-Detect')
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [officerNotes, setOfficerNotes] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef(null)

  const handleFileValidation = (file) => {
    setErrorMessage('')
    if (!file) return false

    if (!SUPPORTED_FORMATS.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|pdf)$/i)) {
      setErrorMessage('Invalid file format. Please upload JPG, PNG, or PDF identity documents.')
      return false
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(`File exceeds 10MB limit (${formatBytes(file.size)}). Please upload a smaller file.`)
      return false
    }

    return true
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && handleFileValidation(file)) {
      setSelectedFile(file)
      setSelectedPreset(null)
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file))
      } else {
        setPreviewUrl(null)
      }
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && handleFileValidation(file)) {
      setSelectedFile(file)
      setSelectedPreset(null)
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file))
      } else {
        setPreviewUrl(null)
      }
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setSelectedPreset(null)
    setErrorMessage('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSelectPreset = async (preset) => {
    setSelectedPreset(preset)
    setSelectedDocType(preset.docType)
    setPreviewUrl(preset.samplePath || null)
    setErrorMessage('')
    if (preset.samplePath) {
      try {
        const res = await fetch(preset.samplePath)
        if (res.ok) {
          const blob = await res.blob()
          const fileObj = new File([blob], preset.fileName, { type: blob.type || 'image/png' })
          setSelectedFile(fileObj)
          return
        }
      } catch (e) {
        console.warn('Failed to load sample blob:', e)
      }
    }
    setSelectedFile({
      name: preset.fileName,
      size: 2450000,
      type: 'image/jpeg'
    })
  }


  const handleTriggerSubmit = () => {
    if (!selectedFile && !selectedPreset) {
      setErrorMessage('Please select a document or use a quick demo preset to continue.')
      return
    }

    onStartVerification({
      file: selectedFile,
      docType: selectedDocType,
      presetId: selectedPreset?.id,
      officerNotes
    })
  }

  return (
    <div className="space-y-6">
      {/* Quick Demo Presets Banner for SIH Evaluator */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-900/40">
        <div className="flex items-center gap-2 mb-2.5">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            SIH Judge & Evaluator Demo Presets
          </span>
          <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
            One-Click Test Cases
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Select a sample preset to test genuine, altered, or counterfeit identity documents instantly:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {DEMO_PRESETS.map((preset) => {
            const isCurrent = selectedPreset?.id === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isCurrent
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">{preset.docType}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      preset.badgeColor === 'emerald'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : preset.badgeColor === 'amber'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {preset.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">{preset.label}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Document Type Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
          Document Classification Standard
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {['Auto-Detect', 'Aadhaar', 'PAN Card', 'Voter ID', 'Driving License', 'Passport'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedDocType(type)}
              className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                selectedDocType === type
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Drag and Drop Zone */}
      {!selectedFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
            dragOver
              ? 'border-blue-500 bg-blue-950/20 scale-[0.99]'
              : 'border-slate-800 bg-[#0d1322]/50 hover:bg-slate-900/40 hover:border-slate-700'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h3 className="text-base font-semibold text-white mb-1">
            Drag and drop document image or PDF
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4 leading-relaxed">
            Support high-resolution Aadhaar, PAN, Voter ID, DL, and Passport scans for deep forensic inspection.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors">
            <span>Browse Computer Files</span>
          </div>

          <p className="text-[11px] text-slate-500 mt-4">
            Accepted: JPG, PNG, PDF • Maximum file size: 10MB
          </p>
        </div>
      ) : (
        /* Selected File Preview Box */
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Selected Document for Screening
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replace File</span>
              </button>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Document Thumbnail"
                className="w-16 h-16 rounded-lg object-cover border border-slate-700"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <FileText className="w-8 h-8" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{selectedFile.name}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                <span>Size: {formatBytes(selectedFile.size || 2450000)}</span>
                <span>•</span>
                <span className="text-blue-400 font-medium">Type: {selectedDocType}</span>
                {selectedPreset && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">Preset Loaded</span>
                  </>
                )}
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ready for AI Scan</span>
            </div>
          </div>

          {/* Officer Verification Notes (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium flex items-center justify-between">
              <span>Checkpoint / Officer Notes (Optional)</span>
              <span className="text-[11px] text-slate-500">Auto-logged in SIH audit trail</span>
            </label>
            <input
              type="text"
              value={officerNotes}
              onChange={(e) => setOfficerNotes(e.target.value)}
              placeholder="e.g. Passenger presented document at Checkpoint B-2. Physical laminate felt slightly thin."
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/40 flex items-center gap-3 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Start Verification Action Button */}
      <div>
        <button
          type="button"
          onClick={handleTriggerSubmit}
          disabled={isProcessing || (!selectedFile && !selectedPreset)}
          className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
            isProcessing || (!selectedFile && !selectedPreset)
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/25 active:scale-[0.99]'
          }`}
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-blue-300" />
              <span>{scanningStage || 'Running Neural Vision Screening...'}</span>
            </>
          ) : (
            <>
              <span>Execute AI Document Screening</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
