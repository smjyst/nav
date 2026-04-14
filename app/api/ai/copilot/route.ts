import { streamText } from 'ai'
import { anthropic as anthropicProvider } from '@ai-sdk/anthropic'
import { NAV_MODEL } from '@/lib/claude/client'
import { NAV_PERSONA, buildMarketContext } from '@/lib/claude/prompts/system'
import { COPILOT_SYSTEM, buildCopilotContext } from '@/lib/claude/prompts/copilot'
import { getFearGreed } from '@/lib/api/alternative'
import { getTopCoins } from '@/lib/api/coingecko'
import type { GuidanceMode, RiskProfile } from '@/lib/supabase/types'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { messages, guidanceMode, riskProfile, contextType } = await req.json()

  // Fetch market context (cached in Redis)
  const [fearGreed, topCoins] = await Promise.all([
    getFearGreed().catch(() => null),
    getTopCoins(10).catch(() => []),
  ])

  const btc = topCoins.find((c) => c.id === 'bitcoin')
  const eth = topCoins.find((c) => c.id === 'ethereum')
  const topMovers = topCoins
    .sort((a, b) => Math.abs(b.price_change_percentage_24h) - Math.abs(a.price_change_percentage_24h))
    .slice(0, 5)
    .map((c) => ({
      name: c.name,
      change: `${c.price_change_percentage_24h > 0 ? '+' : ''}${c.price_change_percentage_24h.toFixed(1)}%`,
    }))

  const marketCtx = fearGreed && btc && eth
    ? buildMarketContext({
        fearGreed: fearGreed.value,
        fearGreedLabel: fearGreed.value_classification,
        btcPrice: btc.current_price,
        btcChange24h: btc.price_change_percentage_24h,
        ethPrice: eth.current_price,
        ethChange24h: eth.price_change_percentage_24h,
        topMovers,
      })
    : 'Market data temporarily unavailable.'

  const userCtx = buildCopilotContext({
    guidanceMode: (guidanceMode as GuidanceMode) || 'beginner',
    riskProfile: (riskProfile as RiskProfile) || 'moderate',
    currentPage: contextType || 'general',
  })

  const systemPrompt = [NAV_PERSONA, COPILOT_SYSTEM, marketCtx, userCtx].join('\n\n')

  const result = streamText({
    model: anthropicProvider(NAV_MODEL),
    system: systemPrompt,
    messages,
    maxOutputTokens: 600,
    temperature: 0.7,
  })

  return result.toTextStreamResponse()
}
