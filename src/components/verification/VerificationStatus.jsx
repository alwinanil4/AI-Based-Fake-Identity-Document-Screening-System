import React from 'react'
import { ShieldCheck, AlertTriangle, ShieldAlert, HelpCircle } from 'lucide-react'
import { getStatusConfig } from '../../utils/helpers'

export default function VerificationStatus({ status, size = 'md', showDescription = false }) {
  const config = getStatusConfig(status)
  
  const getIcon = () => {
    switch ((status || '').toLowerCase()) {
      case 'genuine':
        return <ShieldCheck className={size === 'lg' || size === 'banner' ? 'w-5 h-5 text-emerald-600' : 'w-4 h-4 text-emerald-600'} />
      case 'suspicious':
        return <AlertTriangle className={size === 'lg' || size === 'banner' ? 'w-5 h-5 text-amber-600' : 'w-4 h-4 text-amber-600'} />
      case 'fake':
      case 'fraudulent':
        return <ShieldAlert className={size === 'lg' || size === 'banner' ? 'w-5 h-5 text-red-600' : 'w-4 h-4 text-red-600'} />
      default:
        return <HelpCircle className={size === 'lg' || size === 'banner' ? 'w-5 h-5 text-gray-500' : 'w-4 h-4 text-gray-500'} />
    }
  }

  if (size === 'banner') {
    return (
      <div className={`p-4 rounded-xl border ${config.border} ${config.bg} flex items-center justify-between`}>
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 shadow-card flex items-center justify-center">
            {getIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-base font-bold uppercase tracking-wider ${config.color}`}>
                Verdict: {config.label}
              </span>
              <span className={`w-2.5 h-2.5 rounded-full ${config.indicator}`}></span>
            </div>
            {showDescription && (
              <p className="text-sm text-gray-600 mt-0.5">
                Evaluated against client telemetry, structural OCR, image forensics, and deep vision classifier.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-semibold ${config.badgeClass}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.indicator}`}></span>
      <span>{config.label}</span>
    </span>
  )
}
