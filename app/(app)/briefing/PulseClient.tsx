'use client'

import { useState, useCallback } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PulseHeader from '@/components/pulse/PulseHeader'
import PulseMovers from '@/components/pulse/PulseMovers'
import PulseHeadlines from '@/components/pulse/PulseHeadlines'
import PulsePortfolio from '@/components/pulse/PulsePortfolio'
import PulseActions from '@/components/pulse/PulseActions'
import PulseHistory from '@/components/pulse/PulseHistory'
import PulseSchedule from '@/components/pulse/PulseSchedule'
import type { PulseOutput, PulseContext } from '@/lib/agents/pulse'

interface PulseClientProps {
  initialBriefing: PulseOutput | null
  initialContext?: PulseContext | null
}

export default function PulseClient({ initialBriefing, initialContext }: PulseClientProps) {
  const [pulse, setPulse] = useState<PulseOutput | null>(initialBriefing)
  const [context, setContext] = useState<PulseContext | null>(initialContext ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewingDate, setViewingDate] = useState<string | null>(null)
  const today = new Date().toISOString().split('T')[0]

  const generate = useCallback(async () => {
    setLoading(true)
    setError(null)
    setViewingDate(null)
    try {
      const res = await fetch('/api/ai/briefing', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to generate briefing')
      const data = await res.json()
      setPulse(data.briefing)
      setContext(data.context ?? null)
    } catch {
      setError('Could not generate briefing. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSelectHistorical = useCallback((briefing: PulseOutput) => {
    setPulse(briefing)
    setContext(null) // historical briefings don't have live context
    setViewingDate('past')
  }, [])

  const handleBackToToday = useCallback(() => {
    setViewingDate(null)
    // Will re-render with initialBriefing or empty state
    if (initialBriefing) {
      setPulse(initialBriefing)
      setContext(initialContext ?? null)
    }
  }, [initialBriefing, initialContext])

  // Empty state — no briefing yet
  if (!pulse && !loading) {
    return (
      <div className="space-y-4">
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#6366f1]/10 flex items-center justify-center mx-auto mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/nav-icon-white.svg" alt="NAV" width={22} height={18} />
          </div>
          <h2 className="text-base font-semibold text-white mb-2">
            Your daily briefing is ready to generate
          </h2>
          <p className="text-sm text-[#6b7280] max-w-xs mx-auto mb-5">
            NAV Pulse analyses overnight market moves, trending news, and your portfolio to give you a personalised morning update.
          </p>
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed mx-auto"
          >
            <Sparkles size={16} />
            Generate today&apos;s briefing
          </button>
          {error && (
            <p className="text-xs text-[#ef4444] text-center mt-3">{error}</p>
          )}
        </div>

        {/* Schedule + history even when no current briefing */}
        <PulseSchedule />
        <PulseHistory
          onSelect={handleSelectHistorical}
          selectedDate={viewingDate}
        />
      </div>
    )
  }

  // Loading state
  if (loading && !pulse) {
    return (
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 border-2 border-[#6366f1]/30 rounded-full" />
            <div className="absolute inset-0 w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-white mb-1">
              Generating your briefing...
            </p>
            <p className="text-xs text-[#6b7280]">
              Gathering market data, news, and analysing your portfolio
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!pulse) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-3"
      >
        {/* Viewing historical briefing banner */}
        {viewingDate === 'past' && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#6366f1]/10 border border-[#6366f1]/20"
          >
            <p className="text-xs text-[#818cf8]">
              Viewing a past briefing
            </p>
            <button
              onClick={handleBackToToday}
              className="text-xs text-[#818cf8] hover:text-white font-medium transition-colors"
            >
              Back to today →
            </button>
          </motion.div>
        )}

        {/* Market mood */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4"
        >
          <p className="text-sm text-[#d1d5db] leading-relaxed">{pulse.market_mood}</p>
        </motion.div>

        {/* Header: sentiment + BTC/ETH/F&G */}
        <PulseHeader
          sentiment={pulse.market_sentiment}
          riskLevel={pulse.risk_level}
          emoji={pulse.summary_emoji}
          fearGreed={context?.fearGreed ?? 50}
          fearGreedNote={pulse.fear_greed_note}
          btcDirection={pulse.btc_direction}
          ethDirection={pulse.eth_direction}
        />

        {/* Portfolio (if holdings exist) */}
        {pulse.portfolio_note && (
          <PulsePortfolio
            note={pulse.portfolio_note}
            movers={pulse.portfolio_movers}
            portfolioValue={context?.portfolioValue ?? 0}
            pnl24h={context?.portfolioPnl24h ?? 0}
            pnl24hPct={context?.portfolioPnl24hPct ?? 0}
          />
        )}

        {/* Top movers */}
        <PulseMovers movers={pulse.top_movers} />

        {/* Headlines */}
        <PulseHeadlines headlines={pulse.headlines} />

        {/* NAV's take + actions + learning */}
        <PulseActions
          actions={pulse.action_items}
          learningBite={pulse.learning_bite}
          navTake={pulse.nav_take}
        />

        {/* Regenerate + disclaimer */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-[9px] text-[#4b5563]">
            Analysis, not advice — always do your own research
          </p>
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-1.5 text-[10px] text-[#4b5563] hover:text-[#9ca3af] transition-colors disabled:opacity-40"
          >
            <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Updating...' : 'Refresh'}
          </button>
        </div>

        {/* Schedule settings */}
        <PulseSchedule />

        {/* Briefing history */}
        <PulseHistory
          onSelect={handleSelectHistorical}
          selectedDate={viewingDate}
        />
      </motion.div>
    </AnimatePresence>
  )
}
