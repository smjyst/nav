import { anthropic, NAV_MODEL, cached } from '@/lib/claude/client'
import { NAV_PERSONA } from '@/lib/claude/prompts/system'
import { gatherPulseData } from './gather'
import { PulseOutputSchema, type PulseOutput, type PulseContext } from './schema'

export type { PulseOutput, PulseContext }

// ── System prompt for the Pulse agent ──

const PULSE_AGENT_SYSTEM = `You are NAV Pulse — the daily briefing engine. You produce a personalised market briefing every morning that helps users understand what happened overnight and what it means for them.

## YOUR ROLE

You're the knowledgeable friend who texts them a market update each morning. Not a Bloomberg terminal. Not a corporate newsletter. A smart, warm note from someone who knows their stuff.

## BRIEFING PHILOSOPHY

1. **Lead with insight, not data.** Don't just say "BTC is up 3%". Say what it MEANS — "Bitcoin tested $75K resistance overnight and held above it — that's the first time in two weeks."
2. **Personalise everything.** If they hold ETH and it dropped, acknowledge it. Don't ignore the elephant in the room.
3. **Be honest about uncertainty.** "The market is sending mixed signals today" is fine.
4. **Make it actionable.** Every briefing should leave them with 1-3 things they could consider doing.
5. **Teach something.** Include a "learning bite" — one concept or fact, calibrated to their level. Beginners get "what is market cap?", advanced gets "how does the yield curve affect crypto?"

## TONE BY GUIDANCE MODE

- **beginner**: Short, simple, reassuring. Define any term you use. Under 200 words for market_mood.
- **intermediate**: More nuance, can reference technicals. 200-300 words for market_mood.
- **advanced**: Full analysis with data references. Up to 400 words for market_mood.

## NEWS CURATION

You'll receive trending news headlines. Pick the 2-4 most relevant and summarise each in one sentence. Mark each as bullish, bearish, or neutral impact.

## OUTPUT FORMAT

Return a single JSON object — no markdown, no text outside the JSON:

{
  "market_mood": "<2-4 sentences on the overall market>",
  "market_sentiment": "bullish" | "neutral" | "bearish" | "mixed",
  "risk_level": "low" | "medium" | "high",
  "summary_emoji": "<single emoji: 📈 📉 😐 🔥 ⚡ 🌊>",
  "btc_direction": "<1 sentence on BTC with price context>",
  "eth_direction": "<1 sentence on ETH with price context>",
  "fear_greed_note": "<1 sentence interpreting the Fear & Greed value>",
  "top_movers": [{ "name": "", "symbol": "", "change": "+X.X%", "why": "<1 sentence>" }],
  "headlines": [{ "title": "<short headline>", "summary": "<1 sentence>", "impact": "bullish|bearish|neutral" }],
  "portfolio_note": "<1-2 sentences personalised to holdings, or empty string if no holdings>",
  "portfolio_movers": [{ "symbol": "", "change": "+X.X%", "note": "<1 sentence>" }],
  "action_items": ["<1-3 specific, actionable suggestions>"],
  "learning_bite": { "topic": "<short label>", "content": "<2-3 sentences>" },
  "nav_take": "<1-2 sentences: the key insight of the day>"
}

Keep it human. Warm. Like you're sitting next to them with a coffee.
IMPORTANT: Return ONLY valid JSON. No markdown fences. No text outside the JSON.`

// ── Build the user prompt from gathered context ──

function buildUserPrompt(ctx: PulseContext): string {
  const lines: string[] = []

  lines.push(`Generate today's NAV Pulse briefing.\n`)
  lines.push(`Date: ${ctx.date}`)
  lines.push(`User level: ${ctx.guidanceMode} · Risk profile: ${ctx.riskProfile}\n`)

  // Market snapshot
  lines.push('--- MARKET SNAPSHOT ---')
  lines.push(`Fear & Greed Index: ${ctx.fearGreed}/100 (${ctx.fearGreedLabel})`)
  lines.push(`Bitcoin: $${ctx.btcPrice.toLocaleString()} (${ctx.btcChange24h > 0 ? '+' : ''}${ctx.btcChange24h.toFixed(1)}% 24h)`)
  lines.push(`Ethereum: $${ctx.ethPrice.toLocaleString()} (${ctx.ethChange24h > 0 ? '+' : ''}${ctx.ethChange24h.toFixed(1)}% 24h)\n`)

  // Top movers
  lines.push('--- TOP GAINERS ---')
  for (const g of ctx.topGainers) {
    lines.push(`${g.symbol} (${g.name}): ${g.change} — $${g.price.toLocaleString()}`)
  }
  lines.push('\n--- TOP LOSERS ---')
  for (const l of ctx.topLosers) {
    lines.push(`${l.symbol} (${l.name}): ${l.change} — $${l.price.toLocaleString()}`)
  }

  // Trending news
  if (ctx.trendingNews.length > 0) {
    lines.push('\n--- TRENDING NEWS ---')
    for (const n of ctx.trendingNews) {
      const multi = n.sourceCount > 1 ? ` (${n.sourceCount} sources)` : ''
      lines.push(`• ${n.title}${multi} — via ${n.source}`)
    }
  }

  // Portfolio
  if (ctx.portfolioHoldings.length > 0) {
    lines.push('\n--- USER PORTFOLIO ---')
    lines.push(`Total value: $${ctx.portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)
    lines.push(`24h P&L: ${ctx.portfolioPnl24h >= 0 ? '+' : ''}$${Math.abs(ctx.portfolioPnl24h).toFixed(0)} (${ctx.portfolioPnl24hPct >= 0 ? '+' : ''}${ctx.portfolioPnl24hPct.toFixed(1)}%)`)
    lines.push('Holdings:')
    for (const h of ctx.portfolioHoldings) {
      lines.push(`  ${h.symbol}: ${h.change24h >= 0 ? '+' : ''}${h.change24h.toFixed(1)}% (${h.pnlUsd >= 0 ? '+' : ''}$${Math.abs(h.pnlUsd).toFixed(0)}) — $${h.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)
    }
  } else {
    lines.push('\n--- USER PORTFOLIO ---')
    lines.push('No holdings added yet. Provide general market guidance.')
  }

  return lines.join('\n')
}

// ── Main agent entry point ──

export interface PulseAgentResult {
  pulse: PulseOutput
  context: PulseContext
}

export async function runPulseAgent(params: {
  holdings: Array<{
    coin_id: string
    symbol: string
    name: string
    quantity: number
    average_buy_price: number | null
  }>
  guidanceMode: string
  riskProfile: string
}): Promise<PulseAgentResult> {
  // 1. Gather data
  const ctx = await gatherPulseData(params)

  // 2. Call Claude for structured briefing
  const userPrompt = buildUserPrompt(ctx)

  const response = await anthropic.messages.create({
    model: NAV_MODEL,
    max_tokens: 1500,
    temperature: 0.5,
    system: [
      cached(NAV_PERSONA),
      cached(PULSE_AGENT_SYSTEM),
    ],
    messages: [{ role: 'user', content: userPrompt }],
  })

  // 3. Parse structured output
  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Pulse agent returned non-JSON response')
  }

  const parsed = JSON.parse(jsonMatch[0])
  const pulse = PulseOutputSchema.parse(parsed)

  return { pulse, context: ctx }
}
