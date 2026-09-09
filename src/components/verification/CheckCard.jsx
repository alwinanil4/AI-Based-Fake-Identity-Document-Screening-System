import React from 'react'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

export default function CheckCard({ check }) {
  const { name, passed, score, details } = check

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        passed
          ? 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/30'
          : score > 30
          ? 'bg-amber-950/15 border-amber-500/30 hover:border-amber-500/50'
          : 'bg-rose-950/15 border-rose-500/30 hover:border-rose-500/50'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          {passed ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : score > 30 ? (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="text-sm font-semibold text-slate-200">{name}</span>
        </div>

        <span
          className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
            passed
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : score > 30
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}
        >
          {score.toFixed(1)}%
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed pl-6">
        {details}
      </p>
    </div>
  )
}
