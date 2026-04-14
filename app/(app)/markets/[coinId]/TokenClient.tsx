'use client'

import { useState } from 'react'
import { useCompletion } from '@ai-sdk/react'
import ConvictionCard from '@/components/conviction/ConvictionCard'
import { useUserStore } from '@/lib/stores/userStore'
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
}

export default function TokenClient({ coin }: TokenClientProps) {
  const [conviction, setConviction] = useState<ConvictionScore | null>(null)
  const [loadingConviction, setLoadingConviction] = useState(false)
  const [convictionError, setConvictionError] = useState<string | null>(null)
  const { guidanceMode } = useUserStore()

  const { completion: explanation, complete: explain, isLoading: isExplaining } = useCompletion({
    api: '/api/ai/explain',
  })

  async function loadConviction() {
    setLoadingConviction(true)
    setConvictionError(null)
    try {
      const res = await fetch('/api/ai/conviction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coin }),
      })
      if (!res.ok) throw new Error('Failed to load conviction score')
      const data = await res.json()
      setConviction(data)
    } catch (err) {
      setConvictionError('Could not load conviction score. Please try again.')
    } finally {
      setLoadingConviction(false)
    }
  }

  function handleExplain() {
    if (!conviction) return
    explain('', {
      body: {
        coinName: coin.name,
        symbol: coin.symbol,
        score: conviction.score,
        outlook: conviction.outlook,
        headline: conviction.headline,
        summary: conviction.summary,
        bullCase: conviction.bull_case,
        bearCase: conviction.bear_case,
        guidanceMode,
      },
    })
  }

  if (!conviction && !loadingConviction) {
    return (
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 text-center">
        <p className="text-sm text-[#6b7280] mb-4">
          Get NAV&apos;s AI conviction score for {coin.name}
        </p>
        <button
          onClick={loadConviction}
          className="px-5 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-medium rounded-xl transition-colors"
        >
          Generate NAV Signal
        </button>
      </div>
    )
  }

  if (loadingConviction) {
    return (
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[#9ca3af]">Analysing {coin.name}...</span>
        </div>
      </div>
    )
  }

  if (convictionError) {
    return (
      <div className="bg-[#7f1d1d]/20 border border-[#ef4444]/20 rounded-xl p-4 text-sm text-[#ef4444]">
        {convictionError}
        <button onClick={loadConviction} className="ml-2 underline">Try again</button>
      </div>
    )
  }

  if (!conviction) return null

  return (
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
      onExplain={handleExplain}
      isExplaining={isExplaining}
      explanation={explanation}
    />
  )
}
