import React from 'react'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

export default function CheckCard({ check }) {
  const { name, passed, score, details } = check

  return (
    <div
      className={`p-4 rounded-lg border transition-colors duration-150 ${
        passed
          ? 'bg-white border-gray-200 hover:border-gray-300'
          : score > 30
          ? 'bg-amber-50/60 border-amber-200 hover:border-amber-300'
          : 'bg-red-50/60 border-red-200 hover:border-red-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2">
          {passed ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : score > 30 ? (
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="text-sm font-bold text-gray-900">{name}</span>
        </div>

        <span
          className={`text-sm font-mono font-bold px-2.5 py-0.5 rounded border ${
            passed
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : score > 30
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {score.toFixed(1)}%
        </span>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed pl-7">
        {details}
      </p>
    </div>
  )
}
