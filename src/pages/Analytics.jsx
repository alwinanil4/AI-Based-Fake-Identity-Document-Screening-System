import React, { useEffect, useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieIcon, 
  ShieldAlert, 
  Layers, 
  Activity, 
  Zap,
  Info
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

  if (loading || !data) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-300">Compiling Threat Intelligence Metrics...</p>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl text-xs space-y-1">
          <p className="font-bold text-white mb-1.5">{label}</p>
          {payload.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: item.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}:</span>
              </span>
              <span className="font-mono font-bold text-white">{item.value}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Screening & Threat Intelligence Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated metrics on document fraud detection patterns, tamper vectors, and verification trends.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5" />
          <span>Real-time Telemetry: Active</span>
        </div>
      </div>

      {/* Top Threat Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Genuine Pass Rate</p>
            <p className="text-2xl font-bold text-white mt-0.5">82.3%</p>
            <p className="text-[11px] text-emerald-400 mt-0.5">+2.4% vs last week</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Suspicious Review Rate</p>
            <p className="text-2xl font-bold text-white mt-0.5">14.9%</p>
            <p className="text-[11px] text-amber-400 mt-0.5">Under investigation</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Direct Counterfeits</p>
            <p className="text-2xl font-bold text-white mt-0.5">5.6%</p>
            <p className="text-[11px] text-rose-400 mt-0.5">Prevented entry</p>
          </div>
        </div>
      </div>

      {/* Row 1: Verification Volume Trend & Donut Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Verification Trend Chart (8 cols) */}
        <div className="lg:col-span-8 p-5 rounded-xl bg-[#0d1322] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight uppercase">
                7-Day Screening Volume & Verdict Trends
              </h2>
              <p className="text-xs text-slate-400">Total volume categorized by AI security classification</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGenuine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorSuspicious" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorFake" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="genuine" name="Genuine" stroke="#10B981" fillOpacity={1} fill="url(#colorGenuine)" strokeWidth={2} />
                <Area type="monotone" dataKey="suspicious" name="Suspicious" stroke="#F59E0B" fillOpacity={1} fill="url(#colorSuspicious)" strokeWidth={2} />
                <Area type="monotone" dataKey="fake" name="Fake" stroke="#EF4444" fillOpacity={1} fill="url(#colorFake)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-300">Genuine</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-300">Suspicious</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-300">Fake</span>
            </div>
          </div>
        </div>

        {/* Verdict Distribution Donut (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-xl bg-[#0d1322] border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight uppercase">
              Overall Verdict Share
            </h2>
            <p className="text-xs text-slate-400">Total screened identity documents</p>
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
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0d1322" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            {data.statusDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <span className="font-mono font-semibold text-white">{item.value} docs</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Fraud Vectors Bar Chart & Document Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Fraud Vectors Bar Chart (6 cols) */}
        <div className="lg:col-span-6 p-5 rounded-xl bg-[#0d1322] border border-slate-800 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight uppercase">
              Primary Fraud & Tampering Vectors Detected
            </h2>
            <p className="text-xs text-slate-400">Top methods flagged by the AI forensic vision engine</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.tamperingVectors} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis dataKey="vector" type="category" stroke="#94a3b8" fontSize={10} width={130} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Document Type Breakdown (6 cols) */}
        <div className="lg:col-span-6 p-5 rounded-xl bg-[#0d1322] border border-slate-800 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight uppercase">
              Indian Document Type Vulnerability Matrix
            </h2>
            <p className="text-xs text-slate-400">Screening volume and calculated forgery rate per identity standard</p>
          </div>

          <div className="rounded-lg border border-slate-800 overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Identity Document</th>
                  <th className="py-2.5 px-3 text-right">Volume Screened</th>
                  <th className="py-2.5 px-3 text-right">Anomaly Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {data.docTypeDistribution.map((doc, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-medium text-white">{doc.type}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">{doc.count}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-400">
                      {doc.fakeRate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-900/30 flex items-start gap-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>
              Voter ID (EPIC) demonstrates the highest incidence of non-standard typography and absent hologram seals.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
