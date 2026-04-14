import { NextRequest, NextResponse } from 'next/server'
import { anthropic, NAV_MODEL, cached } from '@/lib/claude/client'
import { NAV_PERSONA } from '@/lib/claude/prompts/system'
import { CONVICTION_SYSTEM, CONVICTION_USER_TEMPLATE } from '@/lib/claude/prompts/conviction'
import { getFearGreed } from '@/lib/api/alternative'
import { getProtocolTVL, defillamaSlug } from '@/lib/api/defillama'
import { redis, CACHE_KEYS, TTL } from '@/lib/redis/client'
import { z } from 'zod'

export const runtime = 'nodejs'
export const maxDuration = 60

const ConvictionOutputSchema = z.object({
  outlook: z.enum(['bull', 'neutral', 'bear']),
  score: z.number().int().min(0).max(100),
  confidence: z.enum(['low', 'medium', 'high']),
  confidence_pct: z.number().int().min(0).max(100),
  headline: z.string(),
  summary: z.string(),
  bull_case: z.string().optional(),
  bear_case: z.string().optional(),
  time_horizon: z.enum(['short', 'medium', 'long']),
  signals_used: z.array(z.string()),
})

interface CoinInput {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
  price_change_percentage_7d_in_currency?: number
  price_change_percentage_30d_in_currency?: number
  market_cap: number
  total_volume: number
  market_cap_rank: number
  ath: number
  ath_change_percentage: number
}

export async function POST(req: NextRequest) {
  const { coin }: { coin: CoinInput } = await req.json()

  if (!coin?.id) {
    return NextResponse.json({ error: 'coin.id required' }, { status: 400 })
  }

  // Check cache first
  const cacheKey = CACHE_KEYS.conviction(coin.id)
  const cached_score = await redis.get(cacheKey)
  if (cached_score) {
    return NextResponse.json(cached_score)
  }

  // Fetch supporting data
  const [fearGreed, tvl] = await Promise.all([
    getFearGreed().catch(() => null),
    (() => {
      const slug = defillamaSlug(coin.id)
      return slug ? getProtocolTVL(slug).catch(() => null) : Promise.resolve(null)
    })(),
  ])

  const userContent = CONVICTION_USER_TEMPLATE({
    coinName: coin.name,
    symbol: coin.symbol,
    price: coin.current_price,
    change24h: coin.price_change_percentage_24h,
    change7d: coin.price_change_percentage_7d_in_currency ?? 0,
    change30d: coin.price_change_percentage_30d_in_currency ?? 0,
    marketCap: coin.market_cap,
    volume24h: coin.total_volume,
    marketCapRank: coin.market_cap_rank,
    ath: coin.ath,
    athChangePercent: coin.ath_change_percentage,
    fearGreed: fearGreed?.value ?? 50,
    tvl: tvl ?? undefined,
  })

  const message = await anthropic.messages.create({
    model: NAV_MODEL,
    max_tokens: 500,
    system: [
      { type: 'text', text: NAV_PERSONA, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: CONVICTION_SYSTEM, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: userContent }],
  })

  const raw = (message.content[0] as { text: string }).text.trim()

  // Strip markdown fences if present
  const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  let parsed
  try {
    parsed = ConvictionOutputSchema.parse(JSON.parse(jsonStr))
  } catch {
    return NextResponse.json({ error: 'Failed to parse conviction score', raw }, { status: 500 })
  }

  // Cache the result
  await redis.setex(cacheKey, TTL.CONVICTION, JSON.stringify(parsed))

  return NextResponse.json(parsed)
}
