import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  ScanLine, 
  History, 
  BarChart3, 
  ShieldCheck
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/verify', label: 'Analyze Document', icon: ScanLine, highlight: true },
  { path: '/history', label: 'Audit History', icon: History },
  { path: '/dashboard', label: 'Operations Center', icon: ShieldCheck },
  { path: '/analytics', label: 'Threat Analytics', icon: BarChart3 },
]

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-gray-200 bg-white flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {/* Navigation Group */}
        <div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Screening System
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
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors duration-150 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 font-medium'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  {item.highlight && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-blue-600"></span>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Supported Documents Badge */}
        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-sm">
          <div className="flex items-center gap-2 text-gray-800 font-bold mb-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Supported Standards</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['Aadhaar', 'PAN Card', 'Voter ID', 'Passport', 'Driving License'].map((doc) => (
              <span
                key={doc}
                className="px-2.5 py-1 rounded bg-white text-gray-700 text-sm border border-gray-200 font-medium"
              >
                {doc}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom SIH Badge */}
      <div className="p-4 border-t border-gray-200">
        <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-200 space-y-1">
          <div className="flex items-center justify-between text-sm font-bold text-gray-900">
            <span>SIH 2026</span>
            <span className="text-sm px-2 py-0.5 rounded bg-white text-gray-700 border border-gray-200 font-mono">
              Team InnovX
            </span>
          </div>
          <p className="text-sm text-gray-500 leading-snug">
            Problem Statement SIH26188
          </p>
        </div>
      </div>
    </aside>
  )
}
