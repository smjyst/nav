'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ConvictionGauge from './ConvictionGauge'
import ExplainAssistant from './ExplainAssistant'
import { getConvictionColors } from '@/lib/utils/conviction'
import { cn } from '@/lib/utils/cn'
import type { ConvictionOutlook, ConvictionConfidence } from '@/lib/supabase/types'

interface ConvictionCardProps {
  coinId: string
  coinName: string
  symbol: string
  score: number
  outlook: ConvictionOutlook
  confidence: ConvictionConfidence
  headline: string
  summary: string
  bullCase?: string
  bearCase?: string
  keyLevels?: { support?: number; resistance?: number }
  signalsUsed?: string[]
  className?: string
}

export default function ConvictionCard({
  coinId,
  coinName,
  symbol,
  score,
  outlook,
  confidence,
  headline,
  summary,
  bullCase,
  bearCase,
  keyLevels,
  signalsUsed,
  className,
}: ConvictionCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showExplain, setShowExplain] = useState(false)
  const colors = getConvictionColors(outlook)

  return (
    <div className={cn('space-y-3', className)}>
      <div
        className="rounded-xl border p-5 bg-[#141414] transition-colors"
        style={{ borderColor: '#2a2a2a' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-sm text-[#9ca3af] mb-1">NAV Signal</p>
            <h3 className="text-white font-semibold text-lg">{coinName}</h3>
            <p className="text-[#9ca3af] text-sm">{symbol}</p>
          </div>
          <ConvictionGauge
            score={score}
            outlook={outlook}
            confidence={confidence}
            size="sm"
            showLabel={true}
            showConfidence={true}
            animated={true}
          />
        </div>

        {/* Headline */}
        <p
          className="text-sm font-medium mb-3 leading-relaxed"
          style={{ color: colors.text }}
        >
          {headline}
        </p>

        {/* Summary */}
        <p className="text-sm text-[#9ca3af] leading-relaxed mb-4">
          {summary}
        </p>

        {/* Expand: Bull/Bear cases */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-[#6b7280] hover:text-[#9ca3af] transition-colors mb-3"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'Less detail' : 'Bull & bear cases'}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-3 mb-4">
                {bullCase && (
                  <div className="rounded-lg p-3 bg-[#064e3b]/30 border border-[#10b981]/20">
                    <p className="text-xs text-[#10b981] font-medium mb-1">Bull case</p>
                    <p className="text-xs text-[#9ca3af] leading-relaxed">{bullCase}</p>
                  </div>
                )}
                {bearCase && (
                  <div className="rounded-lg p-3 bg-[#7f1d1d]/30 border border-[#ef4444]/20">
                    <p className="text-xs text-[#ef4444] font-medium mb-1">Bear case</p>
                    <p className="text-xs text-[#9ca3af] leading-relaxed">{bearCase}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Explain button */}
        {!showExplain && (
          <button
            onClick={() => setShowExplain(true)}
            className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-[#6366f1]/20 text-[#818cf8] hover:bg-[#312e81]/20 hover:border-[#6366f1]/40 transition-all"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/nav-icon-white.svg" alt="" width={12} height={10} />
            Walk me through this
          </button>
        )}
      </div>

      {/* Explain Assistant — pops out below the card */}
      <AnimatePresence>
        {showExplain && (
          <ExplainAssistant
            conviction={{
              coinName,
              symbol,
              score,
              outlook,
              confidence,
              headline,
              summary,
              bullCase,
              bearCase,
              keyLevels,
              signalsUsed,
            }}
            onClose={() => setShowExplain(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
