import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert, 
  FileCheck2, 
  Scan, 
  ArrowRight, 
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

  const total = stats?.total || 0
  const genuineRate = total > 0 ? `${Math.round((stats.genuine / total) * 100)}%` : 'None'
  const suspiciousRate = total > 0 ? `${Math.round((stats.suspicious / total) * 100)}%` : 'None'
  const fakeRate = total > 0 ? `${Math.round((stats.fake / total) * 100)}%` : 'None'

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Welcome & Quick Action Hero */}
      <div className="p-6 sm:p-8 rounded-xl bg-white border border-gray-200 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-sm font-semibold mb-2">
            <Activity className="w-4 h-4" />
            <span>Inspection Terminal</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Document Screening Center
          </h1>
          <p className="text-sm text-gray-600 mt-1 max-w-xl leading-normal">
            Inspect identity documents for image splicing, font anomalies, cloned seals, and synthetic images.
          </p>
        </div>

        <Link
          to="/verify"
          className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors duration-150 shadow-card shrink-0"
        >
          <Scan className="w-4 h-4" />
          <span>Analyze a Document</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Documents"
          value={stats ? stats.total : 0}
          subtitle="Processed in database"
          icon={FileCheck2}
          colorScheme="blue"
        />
        <StatCard
          title="Genuine Documents"
          value={stats ? stats.genuine : 0}
          subtitle="Passed security checks"
          icon={ShieldCheck}
          colorScheme="emerald"
          trend={total > 0 ? { value: `${genuineRate} pass rate`, positive: true } : undefined}
        />
        <StatCard
          title="Suspicious Flags"
          value={stats ? stats.suspicious : 0}
          subtitle="Needs secondary check"
          icon={AlertTriangle}
          colorScheme="amber"
          trend={total > 0 && stats.suspicious > 0 ? { value: `${suspiciousRate} review rate`, positive: false } : undefined}
        />
        <StatCard
          title="Detected Forgeries"
          value={stats ? stats.fake : 0}
          subtitle="Confirmed fraudulent"
          icon={ShieldAlert}
          colorScheme="rose"
          trend={total > 0 && stats.fake > 0 ? { value: `${fakeRate} forgery rate`, positive: false } : undefined}
        />
      </div>

      {/* Recent Verifications Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 tracking-tight uppercase">Recent Analyses</h2>
            <p className="text-sm text-gray-500">Inspection records saved in the database</p>
          </div>
          <Link
            to="/history"
            className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors duration-150"
          >
            <span>View All Records</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <VerificationTable verifications={recentVerifications} isLoading={loading} />
      </div>
    </div>
  )
}
