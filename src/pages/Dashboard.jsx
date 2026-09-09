import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert, 
  FileCheck2, 
  Scan, 
  ArrowRight, 
  Layers, 
  Activity 
} from 'lucide-react'
import StatCard from '../components/common/StatCard'
import VerificationTable from '../components/tables/VerificationTable'
import { api } from '../services/api'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentVerifications, setRecentVerifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [statsData, recents] = await Promise.all([
          api.getDashboardStats(),
          api.getRecentVerifications(5)
        ])
        setStats(statsData)
        setRecentVerifications(recents)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Hero */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-[#0d1322] border border-blue-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>AI Automated Screening Terminal</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Identity Document Verification Center
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-xl">
            Real-time multi-modal screening against physical tampering, synthetic portraits, font variations, and mathematical checksum inconsistencies.
          </p>
        </div>

        <Link
          to="/verify"
          className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/30 shrink-0 group"
        >
          <Scan className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Screen Document</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Screenings"
          value={stats ? stats.total : '—'}
          subtitle="Processed at checkpoints"
          icon={FileCheck2}
          colorScheme="blue"
          trend={{ value: '+14% today', positive: true }}
        />
        <StatCard
          title="Genuine Documents"
          value={stats ? stats.genuine : '—'}
          subtitle="Passed all security criteria"
          icon={ShieldCheck}
          colorScheme="emerald"
          trend={{ value: 'Clearance rate 82%', positive: true }}
        />
        <StatCard
          title="Suspicious Flagged"
          value={stats ? stats.suspicious : '—'}
          subtitle="Requires secondary review"
          icon={AlertTriangle}
          colorScheme="amber"
          trend={{ value: 'Manual check required', positive: false }}
        />
        <StatCard
          title="Counterfeits Detected"
          value={stats ? stats.fake : '—'}
          subtitle="Confirmed fraudulent / fake"
          icon={ShieldAlert}
          colorScheme="rose"
          trend={{ value: 'Zero tolerance block', positive: false }}
        />
      </div>

      {/* Recent Verifications Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Recent Screening Feed</h2>
            <p className="text-xs text-slate-400">Latest identity documents inspected by checkpoint officers</p>
          </div>
          <Link
            to="/history"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
          >
            <span>View All Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <VerificationTable verifications={recentVerifications} isLoading={loading} />
      </div>
    </div>
  )
}
