import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  BarChart3, 
  TrendingUp, 
  ShieldAlert, 
  Activity, 
  FileText,
  Scan
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar 
} from 'recharts'
import { api } from '../services/api'

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const result = await api.getAnalyticsData()
        setData(result)
      } catch (err) {
        console.error('Failed to load analytics:', err)
      } finally {
        setLoading(false)
      }
    }
    loadAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-gray-700">Loading screening metrics from database</p>
      </div>
    )
  }

  const total = data?.totalScreened || 0
  const genuinePct = total > 0 ? ((data.genuineCount / total) * 100).toFixed(1) : '0'
  const suspiciousPct = total > 0 ? ((data.suspiciousCount / total) * 100).toFixed(1) : '0'
  const fakePct = total > 0 ? ((data.fakeCount / total) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Screening Analytics
              </h1>
              <p className="text-sm text-gray-600 mt-0.5">
                Summary of document verification results and flagged tampering patterns.
              </p>
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-sm font-mono font-semibold">
          <Activity className="w-4 h-4" />
          <span>Real Database Telemetry</span>
        </div>
      </div>

      {/* Top Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 uppercase font-bold">Genuine Rate</p>
            <p className="text-2xl font-bold text-gray-900 font-mono mt-0.5">{genuinePct}{total > 0 && '%'}</p>
            <p className="text-sm text-gray-500 mt-0.5">{data?.genuineCount || 0} authentic files</p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 uppercase font-bold">Suspicious Rate</p>
            <p className="text-2xl font-bold text-gray-900 font-mono mt-0.5">{suspiciousPct}{total > 0 && '%'}</p>
            <p className="text-sm text-gray-500 mt-0.5">{data?.suspiciousCount || 0} flagged for review</p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 uppercase font-bold">Forgery Rate</p>
            <p className="text-2xl font-bold text-gray-900 font-mono mt-0.5">{fakePct}{total > 0 && '%'}</p>
            <p className="text-sm text-gray-500 mt-0.5">{data?.fakeCount || 0} fraudulent files blocked</p>
          </div>
        </div>
      </div>

      {total === 0 ? (
        <div className="p-12 sm:p-16 rounded-xl bg-white border border-gray-200 shadow-card text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No documents analyzed yet</h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto leading-normal">
            Analytics reflect actual document verifications processed through the 4-layer screening engine.
          </p>
          <div className="pt-2">
            <Link
              to="/verify"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-card transition-colors duration-150"
            >
              <Scan className="w-4 h-4" />
              <span>Analyze a Document</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Row 1: Volume Trend & Verdict Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Trend Chart (8 cols) */}
            <div className="lg:col-span-8 p-6 rounded-xl bg-white border border-gray-200 shadow-card space-y-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900 tracking-wide uppercase">
                  Volume Trends
                </h2>
                <p className="text-sm text-gray-500">Distribution of verdicts recorded in the database</p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={13} tickLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={13} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px', fontSize: '14px' }} />
                    <Area type="monotone" dataKey="genuine" name="Genuine" stroke="#059669" fill="#059669" fillOpacity={0.15} strokeWidth={2} />
                    <Area type="monotone" dataKey="suspicious" name="Suspicious" stroke="#D97706" fill="#D97706" fillOpacity={0.15} strokeWidth={2} />
                    <Area type="monotone" dataKey="fake" name="Fake" stroke="#DC2626" fill="#DC2626" fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-6 pt-2 border-t border-gray-100 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-600" />
                  <span className="text-gray-700 font-medium">Genuine</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-600" />
                  <span className="text-gray-700 font-medium">Suspicious</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-600" />
                  <span className="text-gray-700 font-medium">Fake</span>
                </div>
              </div>
            </div>

            {/* Verdict Distribution Donut (4 cols) */}
            <div className="lg:col-span-4 p-6 rounded-xl bg-white border border-gray-200 shadow-card space-y-4 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900 tracking-wide uppercase">
                  Verdict Breakdown
                </h2>
                <p className="text-sm text-gray-500">{total} documents evaluated</p>
              </div>

              <div className="h-52 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.statusDistribution}
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px', fontSize: '14px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-100">
                {data.statusDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-700 font-medium">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-gray-900">{item.value} files</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Fraud Vectors & Document Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Tampering Vectors */}
            <div className="lg:col-span-6 p-6 rounded-xl bg-white border border-gray-200 shadow-card space-y-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900 tracking-wide uppercase">
                  Detected Forgery Patterns
                </h2>
                <p className="text-sm text-gray-500">Most frequent anomalies flagged by the forensic layers</p>
              </div>

              {data.tamperingVectors.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">
                  No tampering patterns flagged in current records.
                </div>
              ) : (
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.tamperingVectors} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <XAxis type="number" stroke="#9CA3AF" fontSize={13} tickLine={false} allowDecimals={false} />
                      <YAxis dataKey="vector" type="category" stroke="#6B7280" fontSize={13} width={130} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px', fontSize: '14px' }} />
                      <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Document Type Distribution */}
            <div className="lg:col-span-6 p-6 rounded-xl bg-white border border-gray-200 shadow-card space-y-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900 tracking-wide uppercase">
                  Document Standard Breakdown
                </h2>
                <p className="text-sm text-gray-500">Screening volume and calculated forgery rate per standard</p>
              </div>

              {data.docTypeDistribution.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">
                  No document type breakdown available yet.
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#F8F9FA] text-gray-600 font-bold uppercase tracking-wider border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4">Document Type</th>
                        <th className="py-3 px-4 text-right">Volume</th>
                        <th className="py-3 px-4 text-right">Anomaly Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-800">
                      {data.docTypeDistribution.map((doc, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-semibold text-gray-900">{doc.type}</td>
                          <td className="py-3 px-4 text-right font-mono text-gray-700">{doc.count}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                            {doc.fakeRate}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
