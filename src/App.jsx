import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/common/Navbar'
import Sidebar from './components/common/Sidebar'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import VerifyDocument from './pages/VerifyDocument'
import VerificationResult from './pages/VerificationResult'
import History from './pages/History'
import Analytics from './pages/Analytics'
import { Menu, X } from 'lucide-react'

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <Navbar />

      {/* Mobile Navigation Toggle Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
        <span className="font-semibold text-slate-400">Navigation Menu</span>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div 
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative z-50 w-64 bg-[#0d1322] h-full shadow-2xl">
              <Sidebar />
            </div>
          </div>
        )}

        {/* Dynamic Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/verify" element={<VerifyDocument />} />
            <Route path="/results/:id" element={<VerificationResult />} />
            <Route path="/history" element={<History />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
