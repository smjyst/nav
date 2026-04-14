import { cachedFetch, CACHE_KEYS, TTL } from '@/lib/redis/client'

export interface FearGreedData {
  value: number
  value_classification: string
  timestamp: string
}

export async function getFearGreed(): Promise<FearGreedData> {
  return cachedFetch(
    CACHE_KEYS.fearGreed,
    TTL.FEAR_GREED,
    async () => {
      const res = await fetch('https://api.alternative.me/fng/?limit=1')
      if (!res.ok) throw new Error(`Fear & Greed API error: ${res.status}`)
      const json = await res.json()
      const item = json.data[0]
      return {
        value: parseInt(item.value, 10),
        value_classification: item.value_classification,
        timestamp: item.timestamp,
      }
    }
  )
}

// Map F&G value to a short label
export function fearGreedLabel(value: number): string {
  if (value <= 25) return 'Extreme Fear'
  if (value <= 45) return 'Fear'
  if (value <= 55) return 'Neutral'
  if (value <= 75) return 'Greed'
  return 'Extreme Greed'
}

// Map F&G value to a colour (for UI)
export function fearGreedColor(value: number): string {
  if (value <= 25) return '#ef4444' // red
  if (value <= 45) return '#f97316' // orange
  if (value <= 55) return '#6b7280' // gray
  if (value <= 75) return '#84cc16' // lime
  return '#10b981' // emerald
}
