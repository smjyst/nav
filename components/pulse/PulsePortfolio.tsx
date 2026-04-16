'use client'

import { motion } from 'framer-motion'
import { Briefcase } from 'lucide-react'

interface PortfolioMover {
  symbol: string
  change: string
  note: string
}

interface PulsePortfolioProps {
  note: string
  movers: PortfolioMover[]
  portfolioValue: number
  pnl24h: number
  pnl24hPct: number
}

export default function PulsePortfolio({
  note,
  movers,
  portfolioValue,
  pnl24h,
  pnl24hPct,
}: PulsePortfolioProps) {
  if (!note && movers.length === 0) return null

  const isUp = pnl24h >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Briefcase size={14} className="text-[#6366f1]" />
          <p className="text-xs text-[#6b7280] font-medium uppercase tracking-wide">
            Your portfolio
          </p>
        </div>
        {portfolioValue > 0 && (
          <div className="text-right">
            <p className="text-xs text-[#9ca3af] tabular-nums">
              ${portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p
              className={`text-[10px] font-medium tabular-nums ${
                isUp ? 'text-[#10b981]' : 'text-[#ef4444]'
              }`}
            >
              {isUp ? '+' : ''}${Math.abs(pnl24h).toFixed(0)} ({isUp ? '+' : ''}
              {pnl24hPct.toFixed(1)}%)
            </p>
          </div>
        )}
      </div>

      {note && (
        <p className="text-sm text-[#d1d5db] leading-relaxed mb-3">{note}</p>
      )}

      {movers.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[#1f1f1f]">
          {movers.map((m, i) => {
            const mIsUp = !m.change.startsWith('-')
            return (
              <motion.div
                key={m.symbol}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                className="flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <span className="text-xs font-medium text-white">{m.symbol}</span>
                  <p className="text-[11px] text-[#6b7280] leading-relaxed">{m.note}</p>
                </div>
                <span
                  className={`text-xs font-medium tabular-nums flex-shrink-0 ${
                    mIsUp ? 'text-[#10b981]' : 'text-[#ef4444]'
                  }`}
                >
                  {m.change}
                </span>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
