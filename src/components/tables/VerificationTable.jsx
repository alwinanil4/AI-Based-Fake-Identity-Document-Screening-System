import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowUpRight, Search, FileText, Scan } from 'lucide-react'
import VerificationStatus from '../verification/VerificationStatus'
import { formatDate } from '../../utils/helpers'

export default function VerificationTable({ 
  verifications = [], 
  isLoading = false,
  showFilters = false,
  searchTerm = '',
  onSearchChange,
  statusFilter = 'all',
  onStatusChange,
  docTypeFilter = 'all',
  onDocTypeChange
}) {
  const navigate = useNavigate()
  const [sortBy, setSortBy] = useState('date_desc')

  const sortedVerifications = [...verifications].sort((a, b) => {
    if (sortBy === 'date_desc') {
      return new Date(b.timestamp || b.created_at || 0) - new Date(a.timestamp || a.created_at || 0)
    }
    if (sortBy === 'date_asc') {
      return new Date(a.timestamp || a.created_at || 0) - new Date(b.timestamp || b.created_at || 0)
    }
    if (sortBy === 'confidence_desc') {
      return (b.confidence || 0) - (a.confidence || 0)
    }
    if (sortBy === 'verdict') {
      const order = { fake: 0, suspicious: 1, genuine: 2 }
      const aVal = order[(a.status || a.verdict)?.toLowerCase()] ?? 3
      const bVal = order[(b.status || b.verdict)?.toLowerCase()] ?? 3
      return aVal - bVal
    }
    return 0
  })

  const getVerdictAccentBorder = (status) => {
    const s = (status || '').toLowerCase()
    if (s === 'genuine') return 'border-l-4 border-l-emerald-600'
    if (s === 'fake') return 'border-l-4 border-l-red-600'
    return 'border-l-4 border-l-amber-600'
  }

  return (
    <div className="space-y-4">
      {/* Filter & Sort Controls Header */}
      {showFilters && (
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-card flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder="Search by ID, document name, or type..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#F8F9FA] border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors duration-150"
            />
          </div>

          {/* Status, Type & Sort Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange && onStatusChange(e.target.value)}
              className="px-3.5 py-2.5 rounded-lg bg-[#F8F9FA] border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:border-blue-600"
            >
              <option value="all">All Verdicts</option>
              <option value="genuine">Genuine</option>
              <option value="suspicious">Suspicious</option>
              <option value="fake">Fake</option>
            </select>

            <select
              value={docTypeFilter}
              onChange={(e) => onDocTypeChange && onDocTypeChange(e.target.value)}
              className="px-3.5 py-2.5 rounded-lg bg-[#F8F9FA] border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:border-blue-600"
            >
              <option value="all">All Document Types</option>
              <option value="Aadhaar">Aadhaar</option>
              <option value="PAN">PAN Card</option>
              <option value="Voter">Voter ID</option>
              <option value="Driving">Driving License</option>
              <option value="Passport">Passport</option>
            </select>

            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <span className="text-sm font-semibold text-gray-500 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3.5 py-2.5 rounded-lg bg-[#F8F9FA] border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:border-blue-600"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="confidence_desc">Highest Confidence</option>
                <option value="verdict">Fake First</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-[#F8F9FA] text-gray-600 font-bold uppercase tracking-wider text-sm">
                <th className="py-3.5 px-4">Document</th>
                <th className="py-3.5 px-4">Scan ID</th>
                <th className="py-3.5 px-4">Verdict</th>
                <th className="py-3.5 px-4">Confidence</th>
                <th className="py-3.5 px-4">Evidence Tags</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                      <span className="font-medium text-sm">Loading audit records...</span>
                    </div>
                  </td>
                </tr>
              ) : sortedVerifications.length === 0 ? (
                /* Simple, clean empty state as required by prompt */
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <p className="text-base font-bold text-gray-900">No documents analyzed yet</p>
                      <p className="text-sm text-gray-500 leading-normal">
                        Screen a document to generate your first cryptographic verification record.
                      </p>
                      <Link
                        to="/verify"
                        className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors duration-150 shadow-card"
                      >
                        <Scan className="w-4 h-4" />
                        <span>Analyze a Document</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedVerifications.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/results/${item.id}`)}
                    className={`hover:bg-blue-50/40 cursor-pointer transition-colors duration-150 group ${getVerdictAccentBorder(item.status || item.verdict)}`}
                  >
                    {/* Thumbnail + Document Name */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-10 rounded-md bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {item.thumbnail_base64 ? (
                            <img src={item.thumbnail_base64} alt="Document" className="w-full h-full object-cover" />
                          ) : (
                            <FileText className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 block truncate max-w-[180px] group-hover:text-blue-600 transition-colors duration-150">
                            {item.documentName || item.filename || item.documentType}
                          </span>
                          <span className="text-sm text-gray-500 block">
                            {item.documentType || 'ID Document'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Scan ID */}
                    <td className="py-4 px-4 font-mono font-bold text-blue-700 text-sm">
                      {item.id}
                    </td>

                    {/* Verdict */}
                    <td className="py-4 px-4">
                      <VerificationStatus status={item.status || item.verdict} size="sm" />
                    </td>

                    {/* Confidence Score */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-gray-900 font-mono text-sm">
                          {Math.round(item.confidence || (100 - (item.riskScore || 10)))}%
                        </span>
                        <div className="w-16 h-2 rounded-full bg-gray-100 border border-gray-200 overflow-hidden hidden sm:block">
                          <div 
                            className={`h-full ${
                              (item.status || item.verdict)?.toLowerCase() === 'genuine'
                                ? 'bg-emerald-600'
                                : (item.status || item.verdict)?.toLowerCase() === 'fake'
                                ? 'bg-red-600'
                                : 'bg-amber-600'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(10, item.confidence || 85))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Reason Tags */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-[240px]">
                        {(item.reason_tags || item.anomalies || []).slice(0, 2).map((tag, tIdx) => {
                          const tagText = typeof tag === 'string' ? tag : (tag.title || 'Flagged anomaly')
                          return (
                            <span 
                              key={tIdx}
                              className="text-sm px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-200 font-medium truncate max-w-[200px]"
                              title={tagText}
                            >
                              {tagText}
                            </span>
                          )
                        })}
                        {(!item.reason_tags || item.reason_tags.length === 0) && (!item.anomalies || item.anomalies.length === 0) && (
                          <span className="text-sm text-emerald-800 font-semibold">Passed All Checks</span>
                        )}
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-4 px-4 text-gray-600 font-mono text-sm whitespace-nowrap">
                      {formatDate(item.timestamp || item.created_at)}
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/results/${item.id}`)
                        }}
                        className="p-2 rounded-md bg-white hover:bg-blue-50 text-gray-500 hover:text-blue-700 border border-gray-200 hover:border-blue-300 transition-colors duration-150"
                        title="View Report"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
