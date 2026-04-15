import { z } from 'zod'

/** Structured output schema for the conviction agent */
export const ConvictionOutputSchema = z.object({
  outlook: z.enum(['bull', 'neutral', 'bear']),
  score: z.number().int().min(0).max(100),
  confidence: z.enum(['low', 'medium', 'high']),
  confidence_pct: z.number().int().min(0).max(100),
  headline: z.string(),
  summary: z.string(),
  bull_case: z.string().optional(),
  bear_case: z.string().optional(),
  key_levels: z
    .object({
      support: z.number().optional(),
      resistance: z.number().optional(),
    })
    .optional(),
  time_horizon: z.enum(['short', 'medium', 'long']),
  signals_used: z.array(z.string()),
})

export type ConvictionOutput = z.infer<typeof ConvictionOutputSchema>

/** The data payload the agent gathers before calling Claude */
export interface ConvictionContext {
  coin: {
    id: string
    name: string
    symbol: string
    currentPrice: number
    change24h: number
    change7d: number
    change30d: number
    marketCap: number
    volume24h: number
    rank: number
    ath: number
    athChangePercent: number
    circulatingSupply: number
    totalSupply: number | null
    maxSupply: number | null
  }
  market: {
    fearGreed: number
    fearGreedLabel: string
  }
  chart: {
    prices7d: number[]
    prices30d: number[]
    trend7d: 'up' | 'down' | 'sideways'
    trend30d: 'up' | 'down' | 'sideways'
    volatility7d: number
    highLow30d: { high: number; low: number }
  }
  tvl?: number
  recentNews: string[]
}
