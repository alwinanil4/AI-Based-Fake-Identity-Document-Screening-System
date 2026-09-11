import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({ title, value, subtitle, icon: Icon, trend, colorScheme = 'blue' }) {
  const colorMap = {
    blue: {
      border: 'border-gray-200 hover:border-blue-300',
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    emerald: {
      border: 'border-gray-200 hover:border-emerald-300',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    amber: {
      border: 'border-gray-200 hover:border-amber-300',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    rose: {
      border: 'border-gray-200 hover:border-red-300',
      iconBg: 'bg-red-50 text-red-600 border-red-200',
    }
  }

  const theme = colorMap[colorScheme] || colorMap.blue

  return (
    <div className={`p-5 rounded-xl bg-white border ${theme.border} transition-colors duration-150 shadow-card group`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-extrabold font-mono text-gray-900 mt-1 tracking-tight">{value}</p>
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${theme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm pt-3 border-t border-gray-100">
        <span className="text-gray-600">{subtitle}</span>
        {trend && (
          <span className={`inline-flex items-center gap-1 font-bold ${trend.positive ? 'text-emerald-700' : 'text-red-700'}`}>
            {trend.positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {trend.value}
          </span>
        )}
      </div>
    </div>
  )
}
