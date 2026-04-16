'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import ConvictionCard from '@/components/conviction/ConvictionCard'
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

  return (
    <div className="space-y-4">
      {/* Analyse button — inline in the flow when no result yet */}
      {!result && !loading && !error && (
        <button
          onClick={runAgent}
          className="w-full flex items-center justify-between px-5 py-4 rounded-xl border border-[#6366f1]/20 bg-gradient-to-r from-[#312e81]/15 via-[#141414] to-[#141414] hover:border-[#6366f1]/40 hover:from-[#312e81]/25 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#6366f1]/15 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/nav-icon-white.svg" alt="" width={16} height={13} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">NAV Signal</p>
              <p className="text-xs text-[#6b7280]">
                AI conviction analysis — price action, sentiment, fundamentals & risk
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 px-4 py-2 bg-[#6366f1] group-hover:bg-[#4f46e5] text-white text-xs font-medium rounded-lg transition-colors flex-shrink-0">
            <Sparkles size={12} />
            Analyse
          </span>
        </button>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl border border-[#6366f1]/20 bg-[#141414]">
          <Loader2 size={16} className="text-[#6366f1] animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-white">Analysing {coin.name}...</p>
            <p className="text-xs text-[#6b7280]">Gathering market data, news, and running AI analysis</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between px-5 py-4 rounded-xl border border-[#ef4444]/20 bg-[#7f1d1d]/10">
          <p className="text-sm text-[#ef4444]">{error}</p>
          <button
            onClick={runAgent}
            className="text-xs text-[#ef4444] underline hover:text-[#f87171] transition-colors flex-shrink-0"
          >
            Try again
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          <ConvictionCard
            coinId={coin.id}
            coinName={coin.name}
            symbol={coin.symbol.toUpperCase()}
            score={result.conviction.score}
            outlook={result.conviction.outlook}
            confidence={result.conviction.confidence}
            headline={result.conviction.headline}
            summary={result.conviction.summary}
            bullCase={result.conviction.bull_case}
            bearCase={result.conviction.bear_case}
            keyLevels={result.conviction.key_levels}
            signalsUsed={result.conviction.signals_used}
          />

          {result.conviction.signals_used && result.conviction.signals_used.length > 0 && (
            <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
              <p className="text-xs text-[#6b7280] mb-2 font-medium">Signals analysed</p>
              <div className="flex flex-wrap gap-1.5">
                {result.conviction.signals_used.map((signal) => (
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

          {result.cached && (
            <p className="text-[10px] text-[#4b5563] text-center">
              Cached analysis · Updated every 4 hours
            </p>
          )}
        </>
      )}
    </div>
  )
}
