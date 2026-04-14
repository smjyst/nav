'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ConvictionGauge from './ConvictionGauge'
import ConvictionBadge from './ConvictionBadge'
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
  className?: string
  onExplain?: () => void
  isExplaining?: boolean
  explanation?: string
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
  className,
  onExplain,
  isExplaining,
  explanation,
}: ConvictionCardProps) {
  const [expanded, setExpanded] = useState(false)
  const colors = getConvictionColors(outlook)

  return (
    <div
      className={cn(
        'rounded-[12px] border p-5 bg-[#141414] transition-colors',
        className,
      )}
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

      {/* AI Explanation section */}
      {explanation && (
        <div className="rounded-lg p-3 bg-[#1c1c1c] border border-[#2a2a2a] mb-4">
          <p className="text-xs text-[#6366f1] font-medium mb-1 flex items-center gap-1">
            <Sparkles size={12} /> NAV explains
          </p>
          <p className="text-xs text-[#9ca3af] leading-relaxed whitespace-pre-wrap">
            {explanation}
            {isExplaining && <span className="cursor-blink" />}
          </p>
        </div>
      )}

      {/* Explain button */}
      {onExplain && !explanation && (
        <button
          onClick={onExplain}
          disabled={isExplaining}
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-[#6366f1]/30 text-[#818cf8] hover:bg-[#312e81]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles size={12} />
          {isExplaining ? 'NAV is thinking...' : 'Explain this to me'}
        </button>
      )}
    </div>
  )
}
