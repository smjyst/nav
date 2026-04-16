'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface Mover {
  name: string
  symbol: string
  change: string
  why: string
}

interface PulseMoversProps {
  movers: Mover[]
}

export default function PulseMovers({ movers }: PulseMoversProps) {
  if (movers.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4"
    >
      <p className="text-xs text-[#6b7280] font-medium uppercase tracking-wide mb-3">
        Today&apos;s movers
      </p>
      <div className="space-y-3">
        {movers.map((m, i) => {
          const isUp = !m.change.startsWith('-')
          return (
            <motion.div
              key={m.symbol}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              className="flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isUp ? 'bg-[#10b981]/10' : 'bg-[#ef4444]/10'
                  }`}
                >
                  {isUp ? (
                    <TrendingUp size={12} className="text-[#10b981]" />
                  ) : (
                    <TrendingDown size={12} className="text-[#ef4444]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-medium text-white">{m.symbol}</span>
                    <span className="text-xs text-[#4b5563] truncate">{m.name}</span>
                  </div>
                  <p className="text-[11px] text-[#6b7280] leading-relaxed mt-0.5">{m.why}</p>
                </div>
              </div>
              <span
                className={`text-sm font-medium tabular-nums flex-shrink-0 ${
                  isUp ? 'text-[#10b981]' : 'text-[#ef4444]'
                }`}
              >
                {m.change}
              </span>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
