'use client'

import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react'
import { formatUsd } from '@/lib/utils/formatting'
import type { HoldingWithPrice } from './HoldingsTable'

interface PortfolioSummaryProps {
  holdings: HoldingWithPrice[]
}

export default function PortfolioSummary({ holdings }: PortfolioSummaryProps) {
  const totalValue = holdings.reduce((sum, h) => sum + (h.current_price ?? 0) * h.quantity, 0)
  const totalCost = holdings.reduce((sum, h) => sum + (h.average_buy_price ?? 0) * h.quantity, 0)
  const totalPnl = totalCost > 0 ? totalValue - totalCost : null
  const totalPnlPct = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : null

  const dayChange = holdings.reduce((sum, h) => {
    if (!h.current_price || !h.price_change_24h) return sum
    const prevPrice = h.current_price / (1 + h.price_change_24h / 100)
    return sum + (h.current_price - prevPrice) * h.quantity
  }, 0)

  const stats = [
    {
      label: 'Total Value',
      value: formatUsd(totalValue),
      icon: DollarSign,
      color: '#6366f1',
    },
    {
      label: '24h Change',
      value: `${dayChange >= 0 ? '+' : ''}${formatUsd(Math.abs(dayChange))}`,
      icon: dayChange >= 0 ? TrendingUp : TrendingDown,
      color: dayChange >= 0 ? '#10b981' : '#ef4444',
    },
    {
      label: 'Total P&L',
      value: totalPnl !== null
        ? `${totalPnl >= 0 ? '+' : ''}${formatUsd(Math.abs(totalPnl))}`
        : '—',
      sub: totalPnlPct !== null ? `${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(1)}%` : undefined,
      icon: BarChart3,
      color: totalPnl !== null ? (totalPnl >= 0 ? '#10b981' : '#ef4444') : '#6b7280',
    },
    {
      label: 'Assets',
      value: `${holdings.length}`,
      icon: BarChart3,
      color: '#9ca3af',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="bg-[#141414]/80 backdrop-blur-sm border border-[#1f1f1f] rounded-2xl p-4 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${s.color}15` }}
          >
            <s.icon size={20} style={{ color: s.color }} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-[#6b7280] font-medium">{s.label}</p>
            <p className="text-lg font-bold tabular-nums leading-tight" style={{ color: s.color === '#6b7280' || s.color === '#9ca3af' || s.color === '#6366f1' ? '#f9fafb' : s.color }}>
              {s.value}
            </p>
            {s.sub && (
              <p className="text-[11px] tabular-nums leading-tight" style={{ color: s.color }}>{s.sub}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
