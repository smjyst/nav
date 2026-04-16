'use client'

import { motion } from 'framer-motion'
import { Newspaper, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Headline {
  title: string
  summary: string
  impact: 'bullish' | 'bearish' | 'neutral'
}

interface PulseHeadlinesProps {
  headlines: Headline[]
}

const IMPACT_CONFIG = {
  bullish: {
    icon: TrendingUp,
    color: 'text-[#10b981]',
    dot: 'bg-[#10b981]',
  },
  bearish: {
    icon: TrendingDown,
    color: 'text-[#ef4444]',
    dot: 'bg-[#ef4444]',
  },
  neutral: {
    icon: Minus,
    color: 'text-[#6b7280]',
    dot: 'bg-[#6b7280]',
  },
} as const

export default function PulseHeadlines({ headlines }: PulseHeadlinesProps) {
  if (headlines.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Newspaper size={14} className="text-[#6b7280]" />
        <p className="text-xs text-[#6b7280] font-medium uppercase tracking-wide">
          Headlines
        </p>
      </div>
      <div className="space-y-3">
        {headlines.map((h, i) => {
          const config = IMPACT_CONFIG[h.impact]
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.06 }}
              className="flex items-start gap-2.5"
            >
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${config.dot}`} />
              <div>
                <p className="text-sm text-[#e5e7eb] font-medium leading-snug">{h.title}</p>
                <p className="text-[11px] text-[#6b7280] leading-relaxed mt-0.5">{h.summary}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
