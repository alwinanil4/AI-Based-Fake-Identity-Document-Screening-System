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
        <div className="w-16 bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${Math.min(100, Math.max(0, score))}%`,
              backgroundColor: riskInfo.fillColor
            }}
          />
        </div>
        <span className={`text-sm font-mono font-bold ${riskInfo.color}`}>{score}%</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-white border border-gray-200 shadow-card text-center">
      {/* SVG Radial Gauge */}
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
          {/* Background Track */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="#F3F4F6"
            strokeWidth="7"
            fill="transparent"
          />
          {/* Active Risk Stroke */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke={riskInfo.fillColor}
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-200 ease-out"
          />
        </svg>

        {/* Center Score */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold font-mono text-gray-900 tracking-tight">{score}</span>
          <span className="text-sm uppercase font-mono font-semibold text-gray-500">/ 100</span>
        </div>
      </div>

      {/* Risk Badge */}
      <div className="mt-3">
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${riskInfo.bgClass}`}>
          {riskInfo.level}
        </span>
      </div>

      <p className="text-sm text-gray-600 mt-2 text-center max-w-xs leading-relaxed">
        {riskInfo.description}
      </p>
    </div>
  )
}
