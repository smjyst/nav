'use client'

import { Trash2 } from 'lucide-react'
import { formatUsd, formatQuantity } from '@/lib/utils/formatting'
import PriceChange from '@/components/shared/PriceChange'

export interface HoldingWithPrice {
  id: string
  coin_id: string
  symbol: string
  name: string
  quantity: number
  average_buy_price: number | null
  current_price?: number
  price_change_24h?: number
}

interface HoldingsTableProps {
  holdings: HoldingWithPrice[]
  onDelete: (id: string) => void
  deleting: string | null
}

export default function HoldingsTable({ holdings, onDelete, deleting }: HoldingsTableProps) {
  return (
    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-2 px-4 py-3 text-xs text-[#4b5563] border-b border-[#1f1f1f] hidden md:grid">
        <span>Asset</span>
        <span className="text-right">Holdings</span>
        <span className="text-right">Price</span>
        <span className="text-right">Value</span>
        <span className="text-right">P&L</span>
        <span />
      </div>

      {/* Rows */}
      {holdings.map((h) => {
        const value = (h.current_price ?? 0) * h.quantity
        const costBasis = (h.average_buy_price ?? 0) * h.quantity
        const pnl = costBasis > 0 ? value - costBasis : null
        const pnlPct = costBasis > 0 ? ((value - costBasis) / costBasis) * 100 : null

        return (
          <div
            key={h.id}
            className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-2 px-4 py-3 border-b border-[#1f1f1f] last:border-b-0 items-center hover:bg-[#1c1c1c] transition-colors"
          >
            {/* Asset */}
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{h.name}</p>
              <p className="text-xs text-[#6b7280] uppercase">{h.symbol}</p>
            </div>

            {/* Holdings */}
            <div className="text-right">
              <p className="text-sm text-white tabular-nums">
                {formatQuantity(h.quantity, h.symbol.toUpperCase())}
              </p>
            </div>

            {/* Price */}
            <div className="text-right hidden md:block">
              <p className="text-sm text-[#9ca3af] tabular-nums">
                {h.current_price ? formatUsd(h.current_price) : '—'}
              </p>
              {h.price_change_24h != null && (
                <PriceChange pct={h.price_change_24h} size="sm" />
              )}
            </div>

            {/* Value */}
            <div className="text-right">
              <p className="text-sm text-white tabular-nums font-medium">
                {h.current_price ? formatUsd(value) : '—'}
              </p>
            </div>

            {/* P&L */}
            <div className="text-right hidden md:block">
              {pnl !== null ? (
                <>
                  <p className={`text-sm tabular-nums font-medium ${pnl >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    {pnl >= 0 ? '+' : ''}{formatUsd(Math.abs(pnl))}
                  </p>
                  <p className={`text-xs tabular-nums ${pnlPct! >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    {pnlPct! >= 0 ? '+' : ''}{pnlPct!.toFixed(1)}%
                  </p>
                </>
              ) : (
                <p className="text-xs text-[#4b5563]">—</p>
              )}
            </div>

            {/* Delete */}
            <div className="flex justify-center">
              <button
                onClick={() => { if (confirm(`Remove ${h.name} from portfolio?`)) onDelete(h.id) }}
                disabled={deleting === h.id}
                aria-label={`Delete ${h.name}`}
                title={`Delete ${h.name}`}
                className="p-1.5 rounded-lg text-[#4b5563] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors disabled:opacity-40"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
