import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Scan, 
  Activity, 
  FileText, 
  Eye, 
  Cpu, 
  ArrowRight, 
  Clock, 
  Layers, 
  CheckCircle2 
} from 'lucide-react'

export default function LandingPage() {
  const LAYERS = [
    {
      num: '01',
      name: 'Device and Behavioral Signals',
      desc: 'Checks request headers, environment parameters, and sensor noise consistency.',
      icon: Activity
    },
    {
      num: '02',
      name: 'OCR and Structural Validation',
      desc: 'Verifies ICAO check digits, data fields, and typography alignment.',
      icon: FileText
    },
    {
      num: '03',
      name: 'Image Forensics Engine',
      desc: 'Detects digital splicing, copy-move cloning, and frequency anomalies.',
      icon: Eye
    },
    {
      num: '04',
      name: 'Deep Learning Vision Classifier',
      desc: 'Runs neural network classification and produces Grad-CAM visual heatmaps.',
      icon: Cpu
    }
  ]

  const STATS = [
    { label: 'Screening Speed', value: '< 2.5s', sub: 'Average parallel analysis time' },
    { label: 'Inspection Layers', value: '4 Layers', sub: 'Device, text, forensics, deep vision' },
    { label: 'Supported Documents', value: '5 Standards', sub: 'Aadhaar, PAN, Passport, Voter, DL' },
    { label: 'Visual Explainability', value: 'Grad-CAM', sub: 'Highlights altered pixels' }
  ]

  return (
    <div className="space-y-12 py-4 max-w-5xl mx-auto animate-fade-in">
      {/* Hero Section */}
      <div className="rounded-xl bg-white border border-gray-200 p-8 sm:p-12 text-center shadow-card">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold mb-6">
          <span>DocShield AI</span>
          <span className="text-gray-400">•</span>
          <span>Smart India Hackathon 2026</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight max-w-3xl mx-auto leading-tight">
          Detect forged identity documents in seconds
        </h1>

        <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          DocShield AI screens IDs across 4 inspection layers to catch altered text, cloned seals, and synthetic images.
        </p>

        <div className="mt-8 flex items-center justify-center">
          <Link
            to="/verify"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-colors duration-150 shadow-card"
          >
            <Scan className="w-5 h-5" />
            <span>Analyze a Document</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            How It Works
          </h2>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            Every document passes through four independent checks simultaneously.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {LAYERS.map((layer) => {
            const Icon = layer.icon
            return (
              <div
                key={layer.num}
                className="p-5 rounded-xl bg-white border border-gray-200 shadow-card flex flex-col justify-between space-y-3"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-sm font-bold text-gray-400">
                      {layer.num}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 leading-snug">
                      {layer.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-normal">
                      {layer.desc}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Trust / Credibility Section */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <div
            key={i}
            className="p-5 rounded-xl bg-white border border-gray-200 shadow-card text-center"
          >
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wide block">
              {stat.label}
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 block font-mono">
              {stat.value}
            </span>
            <span className="text-sm text-gray-600 mt-1 block">
              {stat.sub}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
