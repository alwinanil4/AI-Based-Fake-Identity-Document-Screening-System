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
                <th className="py-3 px-4">Verification ID</th>
                <th className="py-3 px-4">Document Type</th>
                <th className="py-3 px-4">Citizen / Subject</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                      <span>Loading records...</span>
                    </div>
                  </td>
                </tr>
              ) : verifications.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-8 h-8 text-slate-600" />
                      <p className="text-sm font-medium text-slate-400">No verification records found</p>
                      <p className="text-xs text-slate-600">Try adjusting your search criteria or screening a new document.</p>
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
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-400 group-hover:text-blue-300">
                      {item.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-200">{item.documentType}</span>
                      <span className="block text-[11px] text-slate-500 truncate max-w-[140px]">
                        {item.documentName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-200">{item.citizenName}</span>
                      <span className="block text-[11px] text-slate-500 font-mono">
                        {item.idNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <VerificationStatus status={item.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <RiskScore score={item.riskScore} size="compact" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {formatDate(item.timestamp)}
                    </td>
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
