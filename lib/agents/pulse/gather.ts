import { getTopCoins, getPrices } from '@/lib/api/coingecko'
import { getFearGreed } from '@/lib/api/alternative'
import { getTrendingNews } from '@/lib/api/coindesk'
import type { PulseContext } from './schema'

interface Holding {
  coin_id: string
  symbol: string
  name: string
  quantity: number
  average_buy_price: number | null
}

/**
 * Gather all market data needed for a daily Pulse briefing.
 * Runs fetches in parallel for speed.
 */
export async function gatherPulseData(params: {
  holdings: Holding[]
  guidanceMode: string
  riskProfile: string
}): Promise<PulseContext> {
  const { holdings, guidanceMode, riskProfile } = params

  // Parallel: market data + news
  const [fearGreed, topCoins, trending] = await Promise.all([
    getFearGreed().catch(() => ({ value: 50, value_classification: 'Neutral', timestamp: '' })),
    getTopCoins(50).catch(() => []),
    getTrendingNews(6).catch(() => []),
  ])

  // Fetch prices for user holdings if they have any
  let holdingPrices: Record<string, { usd: number; usd_24h_change: number }> = {}
  if (holdings.length > 0) {
    holdingPrices = await getPrices(holdings.map((h) => h.coin_id)).catch(() => ({}))
  }

  // BTC & ETH
  const btc = topCoins.find((c) => c.id === 'bitcoin')
  const eth = topCoins.find((c) => c.id === 'ethereum')

  // Sort by 24h change for top movers
  const sorted = [...topCoins]
    .filter((c) => c.price_change_percentage_24h != null)
    .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)

  const topGainers = sorted.slice(0, 5).map((c) => ({
    name: c.name,
    symbol: c.symbol.toUpperCase(),
    change: `${c.price_change_percentage_24h > 0 ? '+' : ''}${c.price_change_percentage_24h.toFixed(1)}%`,
    price: c.current_price,
  }))

  const topLosers = sorted
    .slice(-5)
    .reverse()
    .map((c) => ({
      name: c.name,
      symbol: c.symbol.toUpperCase(),
      change: `${c.price_change_percentage_24h > 0 ? '+' : ''}${c.price_change_percentage_24h.toFixed(1)}%`,
      price: c.current_price,
    }))

  // Calculate portfolio metrics
  let portfolioValue = 0
  let portfolioPnl24h = 0
  const portfolioHoldings: PulseContext['portfolioHoldings'] = []

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
      name: h.name,
      change24h,
      pnlUsd: dayPnl,
      value,
    })
  }

  // Sort portfolio holdings by absolute PnL impact
  portfolioHoldings.sort((a, b) => Math.abs(b.pnlUsd) - Math.abs(a.pnlUsd))

  const prevValue = portfolioValue - portfolioPnl24h
  const portfolioPnl24hPct = prevValue > 0 ? (portfolioPnl24h / prevValue) * 100 : 0

  // Trending news
  const trendingNews = trending.map((n) => ({
    title: n.title,
    source: n.source_info?.name || n.source,
    sourceCount: n.sourceCount,
  }))

  return {
    date: new Date().toISOString().split('T')[0],
    fearGreed: fearGreed.value,
    fearGreedLabel: fearGreed.value_classification,
    btcPrice: btc?.current_price ?? 0,
    btcChange24h: btc?.price_change_percentage_24h ?? 0,
    ethPrice: eth?.current_price ?? 0,
    ethChange24h: eth?.price_change_percentage_24h ?? 0,
    topGainers,
    topLosers,
    trendingNews,
    portfolioValue,
    portfolioPnl24h,
    portfolioPnl24hPct,
    portfolioHoldings,
    guidanceMode,
    riskProfile,
  }
}
