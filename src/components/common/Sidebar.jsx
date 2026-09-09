import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  ScanLine, 
  History, 
  BarChart3, 
  FileText, 
  ShieldCheck, 
  HelpCircle,
  ExternalLink
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/verify', label: 'Verify Document', icon: ScanLine, highlight: true },
  { path: '/history', label: 'Verification History', icon: History },
  { path: '/analytics', label: 'Threat Analytics', icon: BarChart3 },
]

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-slate-800/80 bg-[#0d1322] flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {/* Navigation Group */}
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Operations
          </p>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  {item.highlight && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-blue-500"></span>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Supported Documents Badge */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-semibold mb-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Supported Indian IDs</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['Aadhaar (UIDAI)', 'PAN (NSDL)', 'Voter ID (EPIC)', 'Driving License', 'Passport'].map((doc) => (
              <span
                key={doc}
                className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 text-[10px] border border-slate-700/60"
              >
                {doc}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom SIH Badge */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="p-3 rounded-lg bg-gradient-to-br from-slate-900 to-blue-950/40 border border-blue-900/30">
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium mb-1">
            <span>SIH 2024 Finalist</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">v1.0</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Multi-Modal Vision & Forensic Tamper Screening
          </p>
        </div>
      </div>
    </aside>
  )
}
