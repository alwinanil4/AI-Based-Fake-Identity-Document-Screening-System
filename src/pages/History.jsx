import React, { useEffect, useState } from 'react'
import { History as HistoryIcon, Download, RefreshCw, Filter } from 'lucide-react'
import VerificationTable from '../components/tables/VerificationTable'
import { api } from '../services/api'

export default function History() {
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [docTypeFilter, setDocTypeFilter] = useState('all')

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await api.getVerificationHistory({
        search,
        status: statusFilter,
        docType: docTypeFilter
      })
      setVerifications(data)
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [search, statusFilter, docTypeFilter])

  const handleExportCSV = () => {
    if (verifications.length === 0) return
    const headers = 'Verification ID,Document Type,Citizen Name,ID Number,Status,Risk Score,Timestamp\n'
    const rows = verifications
      .map(v => `"${v.id}","${v.documentType}","${v.citizenName}","${v.idNumber}","${v.status}",${v.riskScore},"${v.timestamp}"`)
      .join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trustid_verification_audit_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Verification Audit History
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete cryptographic and forensic audit trail for all screened identity documents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export CSV Audit Log</span>
          </button>
        </div>
      </div>

      {/* Verification Filterable Table */}
      <VerificationTable
        verifications={verifications}
        isLoading={loading}
        showFilters={true}
        searchTerm={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        docTypeFilter={docTypeFilter}
        onDocTypeChange={setDocTypeFilter}
      />
    </div>
  )
}
