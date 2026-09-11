/**
 * Helper utilities for TrustID AI Document Screening System
 */

export const getStatusConfig = (status) => {
  const normalized = (status || '').toLowerCase()
  switch (normalized) {
    case 'genuine':
      return {
        label: 'Genuine',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        indicator: 'bg-emerald-600',
        iconName: 'ShieldCheck',
      }
    case 'suspicious':
      return {
        label: 'Suspicious',
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        indicator: 'bg-amber-600',
        iconName: 'AlertTriangle',
      }
    case 'fake':
    case 'fraudulent':
      return {
        label: 'Fake / Counterfeit',
        color: 'text-rose-700',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        indicator: 'bg-rose-600',
        iconName: 'ShieldAlert',
      }
    default:
      return {
        label: 'Review Pending',
        color: 'text-gray-700',
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        badgeClass: 'bg-gray-50 text-gray-700 border-gray-200',
        indicator: 'bg-gray-400',
        iconName: 'HelpCircle',
      }
  }
}

export const getRiskScoreLevel = (score) => {
  if (score <= 30) {
    return {
      level: 'Low Risk',
      color: 'text-emerald-700',
      fillColor: '#059669',
      bgClass: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      description: 'Document satisfies structural, typographic, and neural vision criteria without significant variance.'
    }
  }
  if (score <= 70) {
    return {
      level: 'Moderate Risk',
      color: 'text-amber-700',
      fillColor: '#D97706',
      bgClass: 'bg-amber-50 border-amber-200 text-amber-700',
      description: 'Anomalies detected in typography, font kerning, or security overlay. Manual inspection recommended.'
    }
  }
  return {
    level: 'High Risk (Critical)',
    color: 'text-rose-700',
    fillColor: '#DC2626',
    bgClass: 'bg-rose-50 border-rose-200 text-rose-700',
    description: 'Critical failure in algorithmic checksums, copy-move cloning, or high-confidence neural forgery signals.'
  }
}

export const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}
