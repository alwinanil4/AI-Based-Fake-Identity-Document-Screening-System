import React from 'react'
import { ShieldCheck, AlertTriangle, ShieldAlert, HelpCircle } from 'lucide-react'
import { getStatusConfig } from '../../utils/helpers'

export default function VerificationStatus({ status, size = 'md', showDescription = false }) {
  const config = getStatusConfig(status)
  
  const getIcon = () => {
    switch ((status || '').toLowerCase()) {
      case 'genuine':
        return <ShieldCheck className={size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'} />
      case 'suspicious':
        return <AlertTriangle className={size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'} />
      case 'fake':
      case 'fraudulent':
        return <ShieldAlert className={size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'} />
      default:
        return <HelpCircle className={size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'} />
    }
  }

  if (size === 'banner') {
    return (
      <div className={`p-4 rounded-xl border ${config.border} ${config.bg} flex items-center justify-between`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.badgeClass} border`}>
            {getIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-base font-bold uppercase tracking-wider ${config.color}`}>
                Classification: {config.label}
              </span>
              <span className={`w-2 h-2 rounded-full ${config.indicator} animate-ping`}></span>
            </div>
            {showDescription && (
              <p className="text-xs text-slate-300 mt-0.5">
                Evaluated against forensic security checks, OCR typographic match, and tamper models.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${config.badgeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.indicator}`}></span>
      {config.label}
    </span>
  )
}
