import { z } from 'zod'

// ── Structured output schema for the Pulse agent ──

export const PulseOutputSchema = z.object({
  // Market overview
  market_mood: z.string(), // 2-3 sentences on the overall market
  market_sentiment: z.enum(['bullish', 'neutral', 'bearish', 'mixed']),
  risk_level: z.enum(['low', 'medium', 'high']),
  summary_emoji: z.string(), // single emoji

  // Key numbers — headline stats for the UI
  btc_direction: z.string(), // e.g. "up 2.3% — testing $75K resistance"
  eth_direction: z.string(),
  fear_greed_note: z.string(), // 1 sentence interpreting the F&G value

  // Top movers with context
  top_movers: z.array(
    z.object({
      name: z.string(),
      symbol: z.string(),
      change: z.string(), // "+12.3%"
      why: z.string(), // 1 sentence reason
    }),
  ),

  // Headlines — AI-curated top stories
  headlines: z.array(
    z.object({
      title: z.string(),
      summary: z.string(), // 1 sentence
      impact: z.enum(['bullish', 'bearish', 'neutral']),
    }),
  ),

  // Portfolio-specific (empty if no holdings)
  portfolio_note: z.string(), // 1-2 sentences personalised to holdings
  portfolio_movers: z.array(
    z.object({
      symbol: z.string(),
      change: z.string(),
      note: z.string(), // 1 sentence context
    }),
  ),

  // Actionable items
  action_items: z.array(z.string()), // 1-3 specific suggestions

  // Learning bite — calibrated to user's guidance mode
  learning_bite: z.object({
    topic: z.string(), // short label
    content: z.string(), // 2-3 sentences
  }),

  // NAV's take — the "one thing to remember today"
  nav_take: z.string(), // 1-2 sentences: the key insight of the day
})

export type PulseOutput = z.infer<typeof PulseOutputSchema>

// ── Context gathered before calling Claude ──

export interface PulseContext {
  date: string

  // Market data
  fearGreed: number
  fearGreedLabel: string
  btcPrice: number
  btcChange24h: number
  ethPrice: number
  ethChange24h: number

  // Top movers
  topGainers: Array<{ name: string; symbol: string; change: string; price: number }>
  topLosers: Array<{ name: string; symbol: string; change: string; price: number }>

  // News
  trendingNews: Array<{ title: string; source: string; sourceCount: number }>

  // User portfolio
  portfolioValue: number
  portfolioPnl24h: number
  portfolioPnl24hPct: number
  portfolioHoldings: Array<{
    symbol: string
    name: string
    change24h: number
    pnlUsd: number
    value: number
  }>

  // User preferences
  guidanceMode: string
  riskProfile: string
}
