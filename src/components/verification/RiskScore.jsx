import React from 'react'
import { getRiskScoreLevel } from '../../utils/helpers'

export default function RiskScore({ score = 0, size = 'md' }) {
  const riskInfo = getRiskScoreLevel(score)

  // Circular gauge SVG parameters
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  if (size === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, score))}%`,
              backgroundColor: riskInfo.fillColor
            }}
          />
        </div>
        <span className={`text-xs font-bold ${riskInfo.color}`}>{score}%</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
      {/* SVG Radial Gauge */}
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
          {/* Background Track */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="#1f2937"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Active Risk Stroke */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke={riskInfo.fillColor}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Score */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white tracking-tight">{score}</span>
          <span className="text-[10px] uppercase font-bold text-slate-400">/ 100</span>
        </div>
      </div>

      {/* Risk Badge */}
      <div className="mt-3">
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${riskInfo.bgClass}`}>
          {riskInfo.level}
        </span>
      </div>

      <p className="text-[11px] text-slate-400 mt-2 text-center max-w-xs leading-relaxed">
        {riskInfo.description}
      </p>
    </div>
  )
}
