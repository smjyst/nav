import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, NAV_MODEL } from '@/lib/claude/client'
import { NAV_PERSONA } from '@/lib/claude/prompts/system'
import { BRIEFING_SYSTEM, BRIEFING_USER_TEMPLATE } from '@/lib/claude/prompts/briefing'
import { getFearGreed } from '@/lib/api/alternative'
import { getTopCoins, getPrices } from '@/lib/api/coingecko'

export const runtime = 'nodejs'
export const maxDuration = 90

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('guidance_mode, risk_profile')
    .eq('id', user.id)
    .single()

  const guidanceMode = profile?.guidance_mode ?? 'beginner'
  const riskProfile = profile?.risk_profile ?? 'moderate'

  // Get user holdings
  const { data: portfolios } = await supabase
    .from('portfolios')
    .select('*, holdings(*)')
    .eq('user_id', user.id)

  type HoldingRow = { coin_id: string; symbol: string; name: string; quantity: number; average_buy_price: number | null }
  const holdings = (portfolios?.[0] as { holdings: HoldingRow[] } | undefined)?.holdings ?? []

  // Fetch market data
  const [fearGreed, topCoins] = await Promise.all([
    getFearGreed().catch(() => null),
    getTopCoins(50).catch(() => []),
  ])

  // Fetch prices for user holdings
  let holdingPrices: Record<string, { usd: number; usd_24h_change: number }> = {}
  if (holdings.length > 0) {
    holdingPrices = await getPrices(holdings.map((h) => h.coin_id)).catch(() => ({}))
  }

  const btc = topCoins.find((c) => c.id === 'bitcoin')
  const eth = topCoins.find((c) => c.id === 'ethereum')

  const sorted = [...topCoins].sort(
    (a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h
  )
  const topGainers = sorted.slice(0, 3).map((c) => ({
    name: c.name,
    symbol: c.symbol.toUpperCase(),
    change: `${c.price_change_percentage_24h > 0 ? '+' : ''}${c.price_change_percentage_24h.toFixed(1)}%`,
  }))
  const topLosers = sorted.slice(-3).reverse().map((c) => ({
    name: c.name,
    symbol: c.symbol.toUpperCase(),
    change: `${c.price_change_percentage_24h > 0 ? '+' : ''}${c.price_change_percentage_24h.toFixed(1)}%`,
  }))

  // Calculate portfolio metrics
  let portfolioValue = 0
  let portfolioPnl24h = 0
  const portfolioHoldings: Array<{ symbol: string; change24h: number; pnlUsd: number }> = []

  for (const h of holdings) {
    const price = holdingPrices[h.coin_id]
    if (!price) continue
    const value = price.usd * h.quantity
    const change24h = price.usd_24h_change ?? 0
    const prevPrice = price.usd / (1 + change24h / 100)
    const dayPnl = (price.usd - prevPrice) * h.quantity
    portfolioValue += value
    portfolioPnl24h += dayPnl
    portfolioHoldings.push({
      symbol: h.symbol.toUpperCase(),
      change24h,
      pnlUsd: dayPnl,
    })
  }

  const prevValue = portfolioValue - portfolioPnl24h
  const portfolioPnl24hPct = prevValue > 0 ? (portfolioPnl24h / prevValue) * 100 : 0

  const today = new Date().toISOString().split('T')[0]

  // Check if briefing already generated today
  const { data: existing } = await supabase
    .from('daily_briefings')
    .select('id, content')
    .eq('user_id', user.id)
    .eq('briefing_date', today)
    .single()

  if (existing) {
    return NextResponse.json({ briefing: existing.content, cached: true })
  }

  const userContent = BRIEFING_USER_TEMPLATE({
    date: today,
    fearGreed: fearGreed?.value ?? 50,
    fearGreedLabel: fearGreed?.value_classification ?? 'Neutral',
    fearGreedChange: 'unchanged',
    btcChange24h: btc?.price_change_percentage_24h ?? 0,
    ethChange24h: eth?.price_change_percentage_24h ?? 0,
    topGainers,
    topLosers,
    portfolioValue,
    portfolioPnl24h,
    portfolioPnl24hPct,
    portfolioHoldings,
    guidanceMode,
    riskProfile,
  })

  let response
  try {
    response = await anthropic.messages.create({
      model: NAV_MODEL,
      max_tokens: 800,
      system: [NAV_PERSONA, BRIEFING_SYSTEM].join('\n\n'),
      messages: [{ role: 'user', content: userContent }],
    })
  } catch (err) {
    console.error('Claude API failed for briefing:', err)
    return NextResponse.json({ error: 'Failed to generate briefing' }, { status: 503 })
  }

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  let briefingContent
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    briefingContent = JSON.parse(cleaned)
  } catch {
    briefingContent = { market_mood: text, portfolio_note: '', action_items: [], learning_bite: '' }
  }

  // Store in database
  await supabase.from('daily_briefings').insert({
    user_id: user.id,
    briefing_date: today,
    content: briefingContent,
  })

  return NextResponse.json({ briefing: briefingContent, cached: false })
}
