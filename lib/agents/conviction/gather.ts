import { getCoinDetail, getOHLCV } from '@/lib/api/coingecko'
import { getFearGreed } from '@/lib/api/alternative'
import { getProtocolTVL, defillamaSlug } from '@/lib/api/defillama'
import { getNews } from '@/lib/api/coindesk'
import type { ConvictionContext } from './schema'
import type { OHLCVPoint } from '@/lib/api/coingecko'

/** Determine trend direction from a price series */
function detectTrend(prices: number[]): 'up' | 'down' | 'sideways' {
  if (prices.length < 2) return 'sideways'
  const first = prices[0]
  const last = prices[prices.length - 1]
  const changePct = ((last - first) / first) * 100
  if (changePct > 3) return 'up'
  if (changePct < -3) return 'down'
  return 'sideways'
}

/** Compute volatility as standard deviation of daily returns */
function computeVolatility(prices: number[]): number {
  if (prices.length < 2) return 0
  const returns: number[] = []
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1])
  }
  const mean = returns.reduce((s, r) => s + r, 0) / returns.length
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length
  return Math.sqrt(variance) * 100 // as percentage
}

/** Extract close prices from OHLCV data */
function closePrices(ohlcv: OHLCVPoint[]): number[] {
  return ohlcv.map((p) => p.close)
}

/**
 * Gather all data the conviction agent needs to analyse a coin.
 * Runs all fetches in parallel for speed.
 */
export async function gatherConvictionData(coinId: string): Promise<ConvictionContext> {
  const [coinDetail, ohlcv7d, ohlcv30d, fearGreed, news] = await Promise.all([
    getCoinDetail(coinId),
    getOHLCV(coinId, 7),
    getOHLCV(coinId, 30),
    getFearGreed().catch(() => ({ value: 50, value_classification: 'Neutral' })),
    getNews(20).catch(() => []),
  ])

  // TVL for DeFi protocols (optional)
  const slug = defillamaSlug(coinId)
  const tvl = slug ? await getProtocolTVL(slug).catch(() => null) : null

  const md = coinDetail.market_data
  const prices7d = closePrices(ohlcv7d)
  const prices30d = closePrices(ohlcv30d)

  // Find relevant news about this coin
  const symbol = coinDetail.symbol.toUpperCase()
  const name = coinDetail.name.toLowerCase()
  const relevantNews = news
    .filter(
      (n) =>
        n.title.toLowerCase().includes(name) ||
        n.title.toUpperCase().includes(symbol) ||
        n.categories?.toUpperCase().includes(symbol),
    )
    .slice(0, 5)
    .map((n) => `${n.title} (${n.source_info?.name || n.source})`)

  // 30d high/low from OHLCV
  const allPrices30d = ohlcv30d.flatMap((p) => [p.high, p.low])
  const high30d = allPrices30d.length > 0 ? Math.max(...allPrices30d) : md.current_price.usd
  const low30d = allPrices30d.length > 0 ? Math.min(...allPrices30d) : md.current_price.usd

  return {
    coin: {
      id: coinDetail.id,
      name: coinDetail.name,
      symbol: coinDetail.symbol,
      currentPrice: md.current_price.usd,
      change24h: md.price_change_percentage_24h,
      change7d: md.price_change_percentage_7d,
      change30d: md.price_change_percentage_30d,
      marketCap: md.market_cap.usd,
      volume24h: md.total_volume.usd,
      rank: coinDetail.market_cap_rank,
      ath: md.ath.usd,
      athChangePercent: md.ath_change_percentage.usd,
      circulatingSupply: md.circulating_supply,
      totalSupply: md.total_supply,
      maxSupply: md.max_supply,
    },
    market: {
      fearGreed: fearGreed.value,
      fearGreedLabel: fearGreed.value_classification,
    },
    chart: {
      prices7d,
      prices30d,
      trend7d: detectTrend(prices7d),
      trend30d: detectTrend(prices30d),
      volatility7d: computeVolatility(prices7d),
      highLow30d: { high: high30d, low: low30d },
    },
    tvl: tvl ?? undefined,
    recentNews: relevantNews,
  }
}
