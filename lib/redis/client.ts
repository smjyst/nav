import { Redis } from '@upstash/redis'

// Singleton Upstash Redis client — HTTP-based, works in serverless/edge
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Cache key builders
export const CACHE_KEYS = {
  pricesTop100: 'nav:prices:top100',
  price: (coinId: string) => `nav:price:${coinId}`,
  ohlcv: (coinId: string, days: number) => `nav:ohlcv:${coinId}:${days}`,
  tokenMeta: (coinId: string) => `nav:meta:${coinId}`,
  fearGreed: 'nav:fear-greed',
  tvl: (protocol: string) => `nav:tvl:${protocol}`,
  news: (page: number) => `nav:news:${page}`,
  conviction: (coinId: string) => `nav:conviction:${coinId}`,
  wallet: (address: string, chain: string) => `nav:wallet:${address.toLowerCase()}:${chain}`,
  contract: (address: string, chain: string) => `nav:contract:${address.toLowerCase()}:${chain}`,
} as const

// TTL constants (seconds)
export const TTL = {
  PRICES_TOP100: 60,         // 1 min — live prices
  PRICE: 60,
  MARKET_CAP: 5 * 60,        // 5 min
  OHLCV: 15 * 60,            // 15 min
  TOKEN_META: 60 * 60,       // 1 hr
  FEAR_GREED: 60 * 60,       // 1 hr
  TVL: 30 * 60,              // 30 min
  NEWS: 15 * 60,             // 15 min
  CONVICTION: 4 * 60 * 60,   // 4 hrs
  WALLET: 30 * 60,           // 30 min
  CONTRACT: 6 * 60 * 60,     // 6 hrs
} as const

// Generic cache-through helper
export async function cachedFetch<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  // Try Redis first
  const cached = await redis.get<T>(key)
  if (cached !== null) return cached

  // Miss — call fetcher
  const data = await fetcher()
  await redis.setex(key, ttl, JSON.stringify(data))
  return data
}
