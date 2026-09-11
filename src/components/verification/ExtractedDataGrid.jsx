import React from 'react'
import { Copy, Check } from 'lucide-react'

export default function ExtractedDataGrid({ data = {} }) {
  const [copiedKey, setCopiedKey] = React.useState(null)

  const handleCopy = (key, text) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  const formatKeyLabel = (key) => {
    switch (key) {
      case 'fullName': return 'Full Name'
      case 'idNumber': return 'Identity Serial / Number'
      case 'dob': return 'Date of Birth'
      case 'gender': return 'Gender'
      case 'address': return 'Registered Address'
      case 'fatherName': return "Father's / Guardian Name"
      case 'issueDate': return 'Date of Issue'
      case 'validity': return 'Validity / Expiry'
      case 'assemblyConstituency': return 'Assembly Constituency'
      case 'rto': return 'Issuing Authority'
      case 'mrz1': return 'MRZ Line 1'
      case 'mrz2': return 'MRZ Line 2'
      default: return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    }
  }

  const entries = Object.entries(data)

  if (entries.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 text-sm bg-white rounded-lg border border-gray-200">
        No OCR structured data extracted from this scan.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {entries.map(([key, val]) => {
        const isLong = key === 'address' || key.startsWith('mrz')
        return (
          <div
            key={key}
            className={`p-3.5 rounded-lg bg-white border border-gray-200 flex flex-col justify-between group hover:border-gray-300 transition-colors duration-150 shadow-card ${
              isLong ? 'md:col-span-2' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                {formatKeyLabel(key)}
              </span>
              <button
                onClick={() => handleCopy(key, String(val))}
                className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                title="Copy field"
              >
                {copiedKey === key ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className={`text-sm font-bold text-gray-900 ${key.startsWith('mrz') || key === 'idNumber' ? 'font-mono text-blue-700' : ''}`}>
              {String(val)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
