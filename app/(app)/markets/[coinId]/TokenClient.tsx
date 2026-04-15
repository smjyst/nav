'use client'

import { useState } from 'react'
import ConvictionCard from '@/components/conviction/ConvictionCard'
import PriceChart from '@/components/conviction/PriceChart'
import type { CoinDetail } from '@/lib/api/coingecko'
import type { ConvictionOutlook, ConvictionConfidence } from '@/lib/supabase/types'

interface TokenClientProps {
  coin: CoinDetail
}

interface ConvictionScore {
  outlook: ConvictionOutlook
  score: number
  confidence: ConvictionConfidence
  confidence_pct: number
  headline: string
  summary: string
  bull_case?: string
  bear_case?: string
  key_levels?: { support?: number; resistance?: number }
  signals_used?: string[]
  time_horizon?: string
}

interface ChartContext {
  prices7d: number[]
  prices30d: number[]
  trend7d: string
  trend30d: string
  volatility7d: number
  highLow30d: { high: number; low: number }
}

interface AgentResult {
  conviction: ConvictionScore
  context: {
    coin: { currentPrice: number }
    chart: ChartContext
  }
  cached: boolean
}

export default function TokenClient({ coin }: TokenClientProps) {
  const [result, setResult] = useState<AgentResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runAgent() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/conviction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coinId: coin.id }),
      })
      if (!res.ok) throw new Error('Failed to run conviction agent')
      const data: AgentResult = await res.json()
      setResult(data)
    } catch {
      setError('Could not analyse this asset. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Not yet analysed — show the launch button
  if (!result && !loading) {
    return (
      <div className="bg-gradient-to-br from-[#312e81]/10 via-[#141414] to-[#141414] border border-[#6366f1]/20 rounded-xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-[#6366f1]/10 flex items-center justify-center mx-auto mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nav-icon-white.svg" alt="NAV" width={24} height={19} />
        </div>
        <h3 className="text-white font-semibold mb-1">NAV Signal</h3>
        <p className="text-sm text-[#6b7280] mb-5 max-w-xs mx-auto">
          Run NAV&apos;s AI conviction agent to analyse {coin.name} — price action, sentiment, fundamentals, and risk.
        </p>
        <button
          onClick={runAgent}
          className="px-6 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-medium rounded-xl transition-colors"
        >
          Analyse {coin.symbol.toUpperCase()}
        </button>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 border-2 border-[#6366f1]/30 rounded-full" />
            <div className="absolute inset-0 w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-white mb-1">Analysing {coin.name}...</p>
            <p className="text-xs text-[#6b7280]">Gathering market data, news, and running AI analysis</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-[#7f1d1d]/10 border border-[#ef4444]/20 rounded-xl p-5 text-center">
        <p className="text-sm text-[#ef4444] mb-3">{error}</p>
        <button
          onClick={runAgent}
          className="text-xs text-[#ef4444] underline hover:text-[#f87171] transition-colors"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!result) return null

  const { conviction, context } = result

  return (
    <div className="space-y-4">
      {/* Price Chart */}
      <PriceChart
        prices7d={context.chart.prices7d}
        prices30d={context.chart.prices30d}
        currentPrice={context.coin.currentPrice}
        support={conviction.key_levels?.support}
        resistance={conviction.key_levels?.resistance}
      />

      {/* Conviction Card */}
      <ConvictionCard
        coinId={coin.id}
        coinName={coin.name}
        symbol={coin.symbol.toUpperCase()}
        score={conviction.score}
        outlook={conviction.outlook}
        confidence={conviction.confidence}
        headline={conviction.headline}
        summary={conviction.summary}
        bullCase={conviction.bull_case}
        bearCase={conviction.bear_case}
        keyLevels={conviction.key_levels}
        signalsUsed={conviction.signals_used}
      />

      {/* Signals used */}
      {conviction.signals_used && conviction.signals_used.length > 0 && (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
          <p className="text-xs text-[#6b7280] mb-2 font-medium">Signals analysed</p>
          <div className="flex flex-wrap gap-1.5">
            {conviction.signals_used.map((signal) => (
              <span
                key={signal}
                className="text-[10px] px-2 py-0.5 rounded-full bg-[#1c1c1c] border border-[#2a2a2a] text-[#9ca3af]"
              >
                {signal}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Cached indicator */}
      {result.cached && (
        <p className="text-[10px] text-[#4b5563] text-center">
          Cached analysis · Updated every 4 hours
        </p>
      )}
    </div>
  )
}
