import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({ title, value, subtitle, icon: Icon, trend, colorScheme = 'blue' }) {
  const colorMap = {
    blue: {
      bg: 'from-blue-900/20 to-slate-900/40',
      border: 'border-blue-500/20 hover:border-blue-500/40',
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      accent: 'text-blue-400'
    },
    emerald: {
      bg: 'from-emerald-900/20 to-slate-900/40',
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      accent: 'text-emerald-400'
    },
    amber: {
      bg: 'from-amber-900/20 to-slate-900/40',
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      accent: 'text-amber-400'
    },
    rose: {
      bg: 'from-rose-900/20 to-slate-900/40',
      border: 'border-rose-500/20 hover:border-rose-500/40',
      iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      accent: 'text-rose-400'
    }
  }

  const theme = colorMap[colorScheme] || colorMap.blue

  return (
    <div className={`p-5 rounded-xl bg-gradient-to-b ${theme.bg} border ${theme.border} transition-all duration-200 shadow-sm relative overflow-hidden group`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-white mt-1.5 tracking-tight">{value}</p>
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${theme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-800/60">
        <span className="text-slate-400">{subtitle}</span>
        {trend && (
          <span className={`inline-flex items-center gap-1 font-semibold ${trend.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend.positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {trend.value}
          </span>
        )}
      </div>
    </div>
  )
}
