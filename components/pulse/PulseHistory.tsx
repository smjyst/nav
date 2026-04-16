'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, ChevronRight, Loader2 } from 'lucide-react'
import type { PulseOutput } from '@/lib/agents/pulse'

interface BriefingSummary {
  id: string
  date: string
  generatedAt: string
  headline: string
  sentiment: string
  emoji: string
  content: PulseOutput | null
}

interface PulseHistoryProps {
  onSelect: (briefing: PulseOutput) => void
  selectedDate: string | null
}

const SENTIMENT_COLORS: Record<string, string> = {
  bullish: 'text-[#10b981]',
  bearish: 'text-[#ef4444]',
  neutral: 'text-[#6b7280]',
  mixed: 'text-[#f59e0b]',
}

export default function PulseHistory({ onSelect, selectedDate }: PulseHistoryProps) {
  const [briefings, setBriefings] = useState<BriefingSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/api/ai/briefing/history')
        if (res.ok) {
          const data = await res.json()
          setBriefings(data.briefings ?? [])
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  if (loading) {
    return (
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
        <div className="flex items-center gap-2 text-[#6b7280]">
          <Loader2 size={12} className="animate-spin" />
          <span className="text-xs">Loading history...</span>
        </div>
      </div>
    )
  }

  if (briefings.length === 0) return null

  const displayList = expanded ? briefings : briefings.slice(0, 5)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={14} className="text-[#6b7280]" />
        <span className="text-xs font-semibold text-[#9ca3af]">
          Past Briefings
        </span>
        <span className="text-[10px] text-[#4b5563]">
          ({briefings.length})
        </span>
      </div>

      <div className="space-y-1">
        {displayList.map((b) => {
          const isSelected = selectedDate === b.date
          const dateFormatted = new Date(b.date + 'T00:00:00').toLocaleDateString(
            'en-GB',
            { weekday: 'short', day: 'numeric', month: 'short' },
          )

          return (
            <button
              key={b.id}
              onClick={() => b.content && onSelect(b.content)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors group ${
                isSelected
                  ? 'bg-[#6366f1]/10 border border-[#6366f1]/20'
                  : 'hover:bg-[#1c1c1c] border border-transparent'
              }`}
            >
              <span className="text-base leading-none">{b.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#e5e7eb]">
                    {dateFormatted}
                  </span>
                  <span
                    className={`text-[10px] ${SENTIMENT_COLORS[b.sentiment] ?? 'text-[#6b7280]'}`}
                  >
                    {b.sentiment}
                  </span>
                </div>
                <p className="text-[11px] text-[#6b7280] truncate">
                  {b.headline}
                </p>
              </div>
              <ChevronRight
                size={12}
                className="text-[#4b5563] group-hover:text-[#6366f1] flex-shrink-0 transition-colors"
              />
            </button>
          )
        })}
      </div>

      {briefings.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 w-full text-center text-[11px] text-[#6b7280] hover:text-[#9ca3af] transition-colors"
        >
          {expanded ? 'Show less' : `Show all ${briefings.length} briefings`}
        </button>
      )}
    </motion.div>
  )
}
