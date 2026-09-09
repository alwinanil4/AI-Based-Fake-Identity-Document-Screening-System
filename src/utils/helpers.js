/**
 * Helper utilities for TrustID AI Document Screening System
 */

export const getStatusConfig = (status) => {
  const normalized = (status || '').toLowerCase()
  switch (normalized) {
    case 'genuine':
      return {
        label: 'Genuine',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40',
        indicator: 'bg-emerald-500',
        iconName: 'ShieldCheck',
      }
    case 'suspicious':
      return {
        label: 'Suspicious',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-500/40',
        indicator: 'bg-amber-500',
        iconName: 'AlertTriangle',
      }
    case 'fake':
    case 'fraudulent':
      return {
        label: 'Fake / Fraudulent',
        color: 'text-rose-400',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/30',
        badgeClass: 'bg-rose-950/70 text-rose-300 border-rose-500/40',
        indicator: 'bg-rose-500',
        iconName: 'ShieldAlert',
      }
    default:
      return {
        label: 'Pending Review',
        color: 'text-slate-400',
        bg: 'bg-slate-500/10',
        border: 'border-slate-500/30',
        badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
        indicator: 'bg-slate-500',
        iconName: 'HelpCircle',
      }
  }
}

export const getRiskScoreLevel = (score) => {
  if (score <= 30) {
    return {
      level: 'Low Risk',
      color: 'text-emerald-400',
      fillColor: '#10B981',
      bgClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      description: 'Document passes structural, biometric, and security feature benchmarks with minimal variance.'
    }
  }
  if (score <= 70) {
    return {
      level: 'Moderate Risk',
      color: 'text-amber-400',
      fillColor: '#F59E0B',
      bgClass: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      description: 'Anomalies detected in typography, font kerning, or security overlay. Manual inspection recommended.'
    }
  }
  return {
    level: 'High Risk (Critical)',
    color: 'text-rose-400',
    fillColor: '#EF4444',
    bgClass: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    description: 'Critical failure in hologram watermark, algorithmic checksum, or evidence of digital splicing.'
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
