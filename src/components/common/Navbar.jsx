import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Shield, Bell, Scan, UserCheck, Activity } from 'lucide-react'

export default function Navbar() {
  const location = useLocation()

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0d1322]/80 backdrop-blur-md sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between">
      {/* Left branding */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:bg-blue-600/30 transition-all shadow-[0_0_15px_rgba(59,130,246,0.25)]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-base">TrustID</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                AI Screening
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Smart India Hackathon 2024</p>
          </div>
        </Link>
      </div>

      {/* Center status indicator */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="text-slate-300 font-medium">Neural Vision Engine:</span>
        <span className="text-emerald-400 font-semibold">Online (v2.4-SIH)</span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400 text-[11px]">Latency: 18ms</span>
      </div>

      {/* Right officer badge & quick CTA */}
      <div className="flex items-center gap-3">
        {location.pathname !== '/verify' && (
          <Link
            to="/verify"
            className="flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20"
          >
            <Scan className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Screening</span>
          </Link>
        )}

        {/* Notification indicator */}
        <button
          className="w-9 h-9 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors relative"
          title="Security Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400"></span>
        </button>

        {/* Officer badge */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-blue-500/20">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-white leading-tight">Insp. Alwin Anil</p>
            <p className="text-[10px] text-slate-400 leading-tight">Badge #OFF-4029</p>
          </div>
        </div>
      </div>
    </header>
  )
}
