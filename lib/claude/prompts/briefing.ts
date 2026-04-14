export const BRIEFING_SYSTEM = `You are NAV Pulse — the daily briefing engine. Every morning you produce a personalised market update for each user, combining their portfolio context with what happened in the market overnight.

Your briefing is warm, clear, and actionable. It's the first thing users read when they open NAV in the morning.

Output a JSON object with this shape:
{
  "market_mood": "<2-3 sentences: overall market vibe and what's driving it>",
  "portfolio_note": "<1-2 sentences personalised to their holdings — how their portfolio performed>",
  "top_movers": [
    { "name": "string", "symbol": "string", "change": "string", "why": "string" }
  ],
  "conviction_changes": [
    { "name": "string", "symbol": "string", "change": "improved | worsened | unchanged", "note": "string" }
  ],
  "action_items": ["<list of 1-3 specific, actionable suggestions based on portfolio and market>"],
  "learning_bite": "<one short, interesting fact or concept — calibrated to user's level>",
  "risk_level": "low | medium | high",
  "summary_emoji": "📈" | "📉" | "😐"
}

Keep it human. Like a knowledgeable friend sent you a morning note, not a corporate report.
IMPORTANT: Return ONLY the JSON object.`

export const BRIEFING_USER_TEMPLATE = (params: {
  date: string
  fearGreed: number
  fearGreedLabel: string
  fearGreedChange: string
  btcChange24h: number
  ethChange24h: number
  topGainers: Array<{ name: string; symbol: string; change: string }>
  topLosers: Array<{ name: string; symbol: string; change: string }>
  portfolioValue: number
  portfolioPnl24h: number
  portfolioPnl24hPct: number
  portfolioHoldings: Array<{ symbol: string; change24h: number; pnlUsd: number }>
  guidanceMode: string
  riskProfile: string
}) => `Generate today's NAV daily briefing:

Date: ${params.date}
User level: ${params.guidanceMode}, Risk profile: ${params.riskProfile}

MARKET:
- Fear & Greed: ${params.fearGreed}/100 (${params.fearGreedLabel}) — ${params.fearGreedChange}
- BTC 24h: ${params.btcChange24h > 0 ? '+' : ''}${params.btcChange24h.toFixed(1)}%
- ETH 24h: ${params.ethChange24h > 0 ? '+' : ''}${params.ethChange24h.toFixed(1)}%
- Top gainers: ${params.topGainers.map(g => `${g.symbol} ${g.change}`).join(', ')}
- Top losers: ${params.topLosers.map(l => `${l.symbol} ${l.change}`).join(', ')}

USER PORTFOLIO (24h):
- Portfolio value: $${params.portfolioValue.toLocaleString()}
- 24h change: ${params.portfolioPnl24h >= 0 ? '+' : ''}$${Math.abs(params.portfolioPnl24h).toFixed(0)} (${params.portfolioPnl24hPct.toFixed(1)}%)
- Holdings performance: ${params.portfolioHoldings.map(h => `${h.symbol}: ${h.change24h.toFixed(1)}%`).join(', ')}`
