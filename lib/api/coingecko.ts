import { cachedFetch, CACHE_KEYS, TTL } from '@/lib/redis/client'

const BASE = 'https://api.coingecko.com/api/v3'
const HEADERS: HeadersInit = process.env.COINGECKO_API_KEY
  ? { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY }
  : {}

async function cgFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: HEADERS,
    next: { revalidate: 0 }, // managed by Redis cache, not Next.js cache
  })
  if (!res.ok) {
    throw new Error(`CoinGecko ${path} — ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

export interface CoinPrice {
  id: string
  symbol: string
  name: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  total_volume: number
  price_change_percentage_24h: number
  price_change_percentage_7d_in_currency?: number
  price_change_percentage_30d_in_currency?: number
  ath: number
  ath_change_percentage: number
  image: string
  sparkline_in_7d?: { price: number[] }
}

export interface CoinDetail {
  id: string
  symbol: string
  name: string
  description: { en: string }
  image: { thumb: string; small: string; large: string }
  market_cap_rank: number
  market_data: {
    current_price: { usd: number }
    market_cap: { usd: number }
    total_volume: { usd: number }
    price_change_percentage_24h: number
    price_change_percentage_7d: number
    price_change_percentage_30d: number
    ath: { usd: number }
    ath_change_percentage: { usd: number }
    circulating_supply: number
    total_supply: number | null
    max_supply: number | null
  }
  links: {
    homepage: string[]
    twitter_screen_name: string
    github?: { stars?: number }
  }
  categories: string[]
}

export interface OHLCVPoint {
  time: number
  open: number
  high: number
  low: number
  close: number
}

// Top 100 coins by market cap with price data
export async function getTopCoins(limit = 100): Promise<CoinPrice[]> {
  return cachedFetch(
    CACHE_KEYS.pricesTop100,
    TTL.PRICES_TOP100,
    () => cgFetch<CoinPrice[]>(
      `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1` +
      `&sparkline=true&price_change_percentage=7d,30d`
    )
  )
}

// Individual coin detail page
export async function getCoinDetail(coinId: string): Promise<CoinDetail> {
  return cachedFetch(
    CACHE_KEYS.tokenMeta(coinId),
    TTL.TOKEN_META,
    () => cgFetch<CoinDetail>(
      `/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
    )
  )
}

// OHLCV chart data
export async function getOHLCV(coinId: string, days: number): Promise<OHLCVPoint[]> {
  return cachedFetch(
    CACHE_KEYS.ohlcv(coinId, days),
    TTL.OHLCV,
    async () => {
      const raw = await cgFetch<[number, number, number, number, number][]>(
        `/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`
      )
      return raw.map(([time, open, high, low, close]) => ({ time, open, high, low, close }))
    }
  )
}

// Simple price lookup for a set of coins
export async function getPrices(
  coinIds: string[]
): Promise<Record<string, { usd: number; usd_24h_change: number }>> {
  const ids = coinIds.join(',')
  return cgFetch(`/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`)
}

// Search for a coin by name or symbol
export async function searchCoins(query: string): Promise<Array<{ id: string; name: string; symbol: string; thumb: string }>> {
  const res = await cgFetch<{ coins: Array<{ id: string; name: string; symbol: string; thumb: string }> }>(
    `/search?query=${encodeURIComponent(query)}`
  )
  return res.coins.slice(0, 10)
}
