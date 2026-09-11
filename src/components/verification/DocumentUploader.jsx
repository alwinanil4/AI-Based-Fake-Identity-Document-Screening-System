import React, { useState, useRef } from 'react'
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  ArrowRight
} from 'lucide-react'
import { DEMO_PRESETS } from '../../services/api'
import { formatBytes } from '../../utils/helpers'

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png']
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/pjpeg']
const MAX_FILE_SIZE = 16 * 1024 * 1024 // 16MB

export default function DocumentUploader({ onStartVerification, isProcessing }) {
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

    const fileName = (file.name || '').toLowerCase()
    const hasValidExt = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext))
    const fileMime = (file.type || '').toLowerCase()
    const hasValidMime = ALLOWED_MIME_TYPES.includes(fileMime)

    if (!hasValidExt && !hasValidMime) {
      setErrorMessage('Please upload a JPG or PNG image file (.jpg, .jpeg, or .png).')
      return false
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(`File exceeds the 16MB limit (${formatBytes(file.size)}). Please choose a smaller image.`)
      return false
    }

    return true
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && handleFileValidation(file)) {
      setSelectedFile(file)
      setSelectedPreset(null)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && handleFileValidation(file)) {
      setSelectedFile(file)
      setSelectedPreset(null)
      setPreviewUrl(URL.createObjectURL(file))
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
      setErrorMessage('Please choose a document image or select one of the test samples.')
      return
    }

    onStartVerification({
      file: selectedFile,
      docType: selectedDocType,
      presetId: selectedPreset?.id,
      officerNotes,
      previewUrl
    })
  }

  return (
    <div className="space-y-6">
      {/* Sample Document Presets */}
      <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-card">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            Test Samples for Evaluation
          </span>
          <span className="text-sm bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono font-medium">
            4 Samples
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Select a sample document to test the screening pipeline immediately:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DEMO_PRESETS.map((preset) => {
            const isCurrent = selectedPreset?.id === preset.id
            const isGen = preset.badgeColor === 'emerald'
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-3.5 rounded-lg border text-left transition-colors duration-150 ${
                  isCurrent
                    ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-100'
                    : 'bg-gray-50 border-gray-200 hover:bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-gray-900">{preset.docType}</span>
                  <span
                    className={`text-sm px-2 py-0.5 rounded font-semibold border ${
                      isGen
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}
                  >
                    {preset.badge}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">{preset.label}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Document Standard Filter */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-800 uppercase tracking-wide block">
          Document Type Standard
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {['Auto-Detect', 'Aadhaar', 'PAN Card', 'Voter ID', 'Driving License', 'Passport'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedDocType(type)}
              className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors duration-150 ${
                selectedDocType === type
                  ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900'
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
          className={`relative border-2 border-dashed rounded-xl p-8 sm:p-10 text-center cursor-pointer transition-colors duration-150 ${
            dragOver
              ? 'border-blue-600 bg-blue-50/50'
              : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50/70 shadow-card'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>

          <h3 className="text-base font-bold text-gray-900 mb-1">
            Drag and drop document image here
          </h3>
          <p className="text-sm text-gray-600 max-w-sm mx-auto mb-4 leading-relaxed">
            Upload Aadhaar, PAN, Passport, Voter ID, or Driving License image.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors duration-150">
            <span>Browse Computer</span>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Supports JPG, JPEG, and PNG. Maximum file size: 16MB.
          </p>
        </div>
      ) : (
        /* Selected File Card */
        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Selected Document
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-sm font-medium transition-colors duration-150"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replace</span>
              </button>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-150"
                title="Remove file"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3.5 rounded-lg bg-gray-50 border border-gray-200">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Document Preview"
                className="w-16 h-16 rounded-md object-cover border border-gray-200 bg-white"
              />
            ) : (
              <div className="w-16 h-16 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                <FileText className="w-7 h-7" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{selectedFile.name}</p>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                <span>{formatBytes(selectedFile.size || 2450000)}</span>
                <span>•</span>
                <span className="text-blue-700 font-medium">{selectedDocType}</span>
                {selectedPreset && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-800 font-medium">Test Sample</span>
                  </>
                )}
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-emerald-800 text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Ready</span>
            </div>
          </div>

          {/* Inspection Notes */}
          <div className="space-y-1.5">
            <label className="text-sm text-gray-700 font-medium flex items-center justify-between">
              <span>Verification Notes (Optional)</span>
              <span className="text-gray-500">Saved to audit record</span>
            </label>
            <input
              type="text"
              value={officerNotes}
              onChange={(e) => setOfficerNotes(e.target.value)}
              placeholder="e.g. Intake checkpoint verification at primary desk."
              className="w-full px-3.5 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600 transition-colors duration-150"
            />
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-sm text-red-800">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Submit Button */}
      <div>
        <button
          type="button"
          onClick={handleTriggerSubmit}
          disabled={isProcessing || (!selectedFile && !selectedPreset)}
          className={`w-full py-3.5 px-6 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors duration-150 ${
            isProcessing || (!selectedFile && !selectedPreset)
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-card'
          }`}
        >
          <span>Analyze Document</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
