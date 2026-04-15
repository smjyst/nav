'use client'

import { motion } from 'framer-motion'
import { Clock, TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react'

interface ValidateTimingProps {
  assessment: 'early' | 'mid' | 'late' | 'unknown'
  detail: string
  recommendation: string
}

const TIMING_CONFIG = {
  early: {
    icon: TrendingUp,
    label: 'Early stage',
    color: 'text-[#10b981]',
    bg: 'bg-[#10b981]/10',
    barWidth: '25%',
    barColor: '#10b981',
  },
  mid: {
    icon: Minus,
    label: 'Mid cycle',
    color: 'text-[#f59e0b]',
    bg: 'bg-[#f59e0b]/10',
    barWidth: '55%',
    barColor: '#f59e0b',
  },
  late: {
    icon: TrendingDown,
    label: 'Late stage',
    color: 'text-[#ef4444]',
    bg: 'bg-[#ef4444]/10',
    barWidth: '85%',
    barColor: '#ef4444',
  },
  unknown: {
    icon: HelpCircle,
    label: 'Unknown',
    color: 'text-[#6b7280]',
    bg: 'bg-[#6b7280]/10',
    barWidth: '0%',
    barColor: '#6b7280',
  },
} as const

export default function ValidateTiming({ assessment, detail, recommendation }: ValidateTimingProps) {
  const config = TIMING_CONFIG[assessment]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Clock size={14} className="text-[#6b7280]" />
        <span className="text-xs font-semibold text-[#9ca3af]">Entry Timing</span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={16} className={config.color} />
        </div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${config.color}`}>{config.label}</p>
          <p className="text-xs text-[#6b7280] leading-relaxed">{detail}</p>
        </div>
      </div>

      {/* Timing bar */}
      {assessment !== 'unknown' && (
        <div className="mb-3">
          <div className="flex justify-between text-[9px] text-[#4b5563] mb-1">
            <span>Early</span>
            <span>Mid</span>
            <span>Late</span>
          </div>
          <div className="h-1.5 bg-[#1c1c1c] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: config.barColor }}
              initial={{ width: 0 }}
              animate={{ width: config.barWidth }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
            />
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div className="bg-[#0a0a0a]/60 rounded-lg p-3 border border-[#2a2a2a]">
        <div className="flex items-start gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nav-icon-white.svg" alt="" width={12} height={10} className="mt-0.5 flex-shrink-0 opacity-60" />
          <p className="text-xs text-[#d1d5db] leading-relaxed">{recommendation}</p>
        </div>
      </div>
    </motion.div>
  )
}
