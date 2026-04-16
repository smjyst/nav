'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react'
import type { PulseOutput } from '@/lib/agents/pulse'

interface PulseHeaderProps {
  sentiment: PulseOutput['market_sentiment']
  riskLevel: PulseOutput['risk_level']
  emoji: string
  fearGreed: number
  fearGreedNote: string
  btcDirection: string
  ethDirection: string
}

const SENTIMENT_CONFIG = {
  bullish: {
    icon: TrendingUp,
    label: 'Bullish',
    color: 'text-[#10b981]',
    bg: 'bg-[#064e3b]/30',
    border: 'border-[#10b981]/20',
  },
  bearish: {
    icon: TrendingDown,
    label: 'Bearish',
    color: 'text-[#ef4444]',
    bg: 'bg-[#7f1d1d]/20',
    border: 'border-[#ef4444]/20',
  },
  neutral: {
    icon: Minus,
    label: 'Neutral',
    color: 'text-[#6b7280]',
    bg: 'bg-[#1f2937]/30',
    border: 'border-[#6b7280]/20',
  },
  mixed: {
    icon: Activity,
    label: 'Mixed signals',
    color: 'text-[#f59e0b]',
    bg: 'bg-[#78350f]/20',
    border: 'border-[#f59e0b]/20',
  },
} as const

const RISK_CONFIG = {
  low: { color: 'text-[#10b981]', bg: 'bg-[#10b981]/10' },
  medium: { color: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/10' },
  high: { color: 'text-[#ef4444]', bg: 'bg-[#ef4444]/10' },
} as const

export default function PulseHeader({
  sentiment,
  riskLevel,
  emoji,
  fearGreed,
  fearGreedNote,
  btcDirection,
  ethDirection,
}: PulseHeaderProps) {
  const s = SENTIMENT_CONFIG[sentiment]
  const r = RISK_CONFIG[riskLevel]
  const Icon = s.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-5 ${s.bg} ${s.border}`}
    >
      {/* Sentiment + risk badges */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <Icon size={16} className={s.color} />
          <span className={`text-sm font-semibold ${s.color}`}>{s.label}</span>
        </div>
        <span className="text-lg">{emoji}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${r.bg} ${r.color} ml-auto`}>
          {riskLevel} risk
        </span>
      </div>

      {/* BTC / ETH / Fear&Greed row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-0">
        <div className="bg-[#0a0a0a]/40 rounded-lg p-3">
          <p className="text-[10px] text-[#4b5563] font-medium mb-1">BITCOIN</p>
          <p className="text-xs text-[#d1d5db] leading-relaxed">{btcDirection}</p>
        </div>
        <div className="bg-[#0a0a0a]/40 rounded-lg p-3">
          <p className="text-[10px] text-[#4b5563] font-medium mb-1">ETHEREUM</p>
          <p className="text-xs text-[#d1d5db] leading-relaxed">{ethDirection}</p>
        </div>
        <div className="bg-[#0a0a0a]/40 rounded-lg p-3">
          <p className="text-[10px] text-[#4b5563] font-medium mb-1">FEAR & GREED</p>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 h-1.5 bg-[#1c1c1c] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  backgroundColor:
                    fearGreed <= 25 ? '#ef4444' :
                    fearGreed <= 45 ? '#f97316' :
                    fearGreed <= 55 ? '#6b7280' :
                    fearGreed <= 75 ? '#84cc16' : '#10b981',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${fearGreed}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs font-medium text-[#e5e7eb] tabular-nums">{fearGreed}</span>
          </div>
          <p className="text-[10px] text-[#6b7280] leading-snug">{fearGreedNote}</p>
        </div>
      </div>
    </motion.div>
  )
}
