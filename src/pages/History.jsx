import React, { useEffect, useState } from 'react'
import { History as HistoryIcon, Download, RefreshCw } from 'lucide-react'
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
    const headers = 'Verification ID,Document Type,Document Name,Verdict,Confidence %,Timestamp\n'
    const rows = verifications
      .map(v => `"${v.id}","${v.documentType || 'ID'}","${v.documentName || v.filename || ''}","${v.status || v.verdict || ''}",${v.confidence || 0},"${v.timestamp || v.created_at || ''}"`)
      .join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `docshield_verification_audit_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <HistoryIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Audit History
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">
              Records and forensic logs for all analyzed identity documents.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900 shadow-card transition-colors duration-150"
            title="Refresh database records"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportCSV}
            disabled={verifications.length === 0}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold shadow-card transition-colors duration-150 ${
              verifications.length === 0
                ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Export CSV Log</span>
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
