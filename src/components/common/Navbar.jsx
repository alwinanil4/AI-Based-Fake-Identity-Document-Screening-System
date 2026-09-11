import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Shield, Scan, UserCheck } from 'lucide-react'

export default function Navbar() {
  const location = useLocation()

  return (
    <header className="h-16 border-b border-gray-200 bg-white sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between shadow-xs">
      {/* Left branding */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors duration-150">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-gray-900 text-base">DocShield AI</span>
              <span className="text-sm uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                SIH 2026
              </span>
            </div>
            <p className="text-sm text-gray-500 hidden sm:block">Team InnovX • PS SIH26188</p>
          </div>
        </Link>
      </div>

      {/* Center status indicator */}
      <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
        <span className="text-gray-600 font-medium">Vision Engine:</span>
        <span className="text-emerald-700 font-semibold">Online</span>
      </div>

      {/* Right officer badge & quick CTA */}
      <div className="flex items-center gap-3">
        {location.pathname !== '/verify' && (
          <Link
            to="/verify"
            className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-150 shadow-card"
          >
            <Scan className="w-4 h-4" />
            <span>Analyze Document</span>
          </Link>
        )}

        {/* Officer badge */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-bold text-gray-900 leading-tight">Insp. Alwin Anil</p>
            <p className="text-sm text-gray-500 font-mono leading-tight">OFF-4029</p>
          </div>
        </div>
      </div>
    </header>
  )
}
