import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, ShieldAlert, ArrowUpRight, Search, FileText } from 'lucide-react'
import VerificationStatus from '../verification/VerificationStatus'
import RiskScore from '../verification/RiskScore'
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

  return (
    <div className="space-y-4">
      {/* Optional Filter Controls Header */}
      {showFilters && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center gap-3 justify-between">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by ID, name, or serial..."
              className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status & Type Selectors */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Verdicts</option>
              <option value="genuine">Genuine Only</option>
              <option value="suspicious">Suspicious Only</option>
              <option value="fake">Fake Only</option>
            </select>

            <select
              value={docTypeFilter}
              onChange={(e) => onDocTypeChange(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Documents</option>
              <option value="Aadhaar">Aadhaar</option>
              <option value="PAN">PAN Card</option>
              <option value="Voter">Voter ID</option>
              <option value="Driving">Driving License</option>
              <option value="Passport">Passport</option>
            </select>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1322] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Document</th>
                <th className="py-3 px-4">Scan ID</th>
                <th className="py-3 px-4">Verdict</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Reason Tags</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                      <span>Loading scan records from database...</span>
                    </div>
                  </td>
                </tr>
              ) : verifications.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-8 h-8 text-slate-600" />
                      <p className="text-sm font-medium text-slate-400">No scan records found in database</p>
                      <p className="text-xs text-slate-600">Screen a new document to generate live forensic scan logs.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                verifications.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/results/${item.id}`)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    {/* Thumbnail + Document Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-10 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                          {item.thumbnail_base64 ? (
                            <img src={item.thumbnail_base64} alt="Doc Thumb" className="w-full h-full object-cover" />
                          ) : (
                            <FileText className="w-5 h-5 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-200 block truncate max-w-[160px]">
                            {item.documentName || item.filename || item.documentType}
                          </span>
                          <span className="text-[10px] text-slate-500 block uppercase font-mono">
                            {item.documentType || 'ID Document'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Scan ID */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-400 group-hover:text-blue-300">
                      {item.id}
                    </td>

                    {/* Verdict */}
                    <td className="py-3.5 px-4">
                      <VerificationStatus status={item.status || item.verdict} size="sm" />
                    </td>

                    {/* Confidence Score */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono text-xs">
                          {Math.round(item.confidence || (100 - (item.riskScore || 10)))}%
                        </span>
                        <div className="w-14 h-1.5 rounded-full bg-slate-800 overflow-hidden hidden sm:block">
                          <div 
                            className={`h-full ${
                              (item.status || item.verdict)?.toLowerCase() === 'genuine'
                                ? 'bg-emerald-500'
                                : (item.status || item.verdict)?.toLowerCase() === 'fake'
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(10, item.confidence || 85))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Reason Tags */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {(item.reason_tags || item.anomalies || []).slice(0, 2).map((tag, tIdx) => {
                          const tagText = typeof tag === 'string' ? tag : (tag.title || 'Anomaly flagged')
                          return (
                            <span 
                              key={tIdx}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 truncate max-w-[190px]"
                              title={tagText}
                            >
                              {tagText}
                            </span>
                          )
                        })}
                        {(!item.reason_tags || item.reason_tags.length === 0) && (!item.anomalies || item.anomalies.length === 0) && (
                          <span className="text-[11px] text-emerald-400/80 font-medium">Verified Clean</span>
                        )}
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {formatDate(item.timestamp || item.created_at)}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/results/${item.id}`)
                        }}
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-blue-600/30 text-slate-400 hover:text-blue-300 border border-slate-700/60 transition-colors"
                        title="View Detailed AI Audit"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
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
