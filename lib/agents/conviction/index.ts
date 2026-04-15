import { anthropic, NAV_MODEL, cached } from '@/lib/claude/client'
import { NAV_PERSONA } from '@/lib/claude/prompts/system'
import { redis, CACHE_KEYS, TTL } from '@/lib/redis/client'
import { gatherConvictionData } from './gather'
import { ConvictionOutputSchema, type ConvictionOutput, type ConvictionContext } from './schema'

/** Enhanced system prompt for the conviction agent */
const CONVICTION_AGENT_SYSTEM = `You are NAV's Conviction Analysis Agent — a dedicated research analyst that produces structured investment conviction scores for crypto assets.

You follow a rigorous, repeatable analysis pipeline:

## ANALYSIS FRAMEWORK

1. **Price Action Analysis**
   - 24h / 7d / 30d trends — is momentum building or fading?
   - Position within 30d range — near highs (resistance) or lows (support)?
   - 7d volatility — is the asset stable or chaotic?

2. **Market Context**
   - Fear & Greed Index — is the broader market risk-on or risk-off?
   - How is this asset performing vs. the overall market direction?

3. **Fundamental Assessment**
   - Market cap rank and liquidity (volume/market cap ratio)
   - Distance from ATH — has recovery potential or still in freefall?
   - Supply dynamics (circulating vs. total vs. max supply)
   - TVL if DeFi — is capital flowing in or out?

4. **Catalyst & News Check**
   - Recent headlines — any catalysts, partnerships, hacks, regulatory news?
   - Are headlines consistent with price action?

5. **Key Levels**
   - Identify the nearest support level (30d low area) and resistance level (30d high area)

## OUTPUT FORMAT

Return a single JSON object — no markdown, no explanation outside the JSON:

{
  "outlook": "bull" | "neutral" | "bear",
  "score": <integer 0-100>,
  "confidence": "low" | "medium" | "high",
  "confidence_pct": <integer 0-100>,
  "headline": "<max 15 words — the verdict>",
  "summary": "<3-4 sentences plain English for a non-expert. Explain what the data shows and what it means for someone considering this asset.>",
  "bull_case": "<one sentence — strongest reason to be optimistic>",
  "bear_case": "<one sentence — most important risk or warning>",
  "key_levels": { "support": <price>, "resistance": <price> },
  "time_horizon": "short" | "medium" | "long",
  "signals_used": ["<list every data point that influenced the score>"]
}

## SCORING GUIDE

- **75-100 (Strong Bull)**: Clear uptrend, positive catalysts, strong fundamentals, market tailwinds
- **60-74 (Mild Bull)**: Positive lean but with some uncertainty
- **40-59 (Neutral)**: Mixed signals, no strong directional bias, wait-and-see
- **25-39 (Mild Bear)**: Negative lean, deteriorating metrics, proceed with caution
- **0-24 (Strong Bear)**: Clear downtrend, red flags, consider reducing exposure

IMPORTANT: Return ONLY the JSON object. No markdown fences. No commentary outside the JSON.`

/** Build the user message with all gathered data */
function buildUserMessage(ctx: ConvictionContext): string {
  const c = ctx.coin
  const ch = ctx.chart

  let message = `Analyse this asset and produce a conviction score:

=== ASSET: ${c.name} (${c.symbol.toUpperCase()}) ===
Current price: $${c.currentPrice.toLocaleString()}
Market cap: $${(c.marketCap / 1e9).toFixed(2)}B (rank #${c.rank})
24h volume: $${(c.volume24h / 1e6).toFixed(0)}M
Volume/MCap ratio: ${((c.volume24h / c.marketCap) * 100).toFixed(2)}%

=== PRICE ACTION ===
24h change: ${c.change24h?.toFixed(2) ?? 'N/A'}%
7d change: ${c.change7d?.toFixed(2) ?? 'N/A'}%
30d change: ${c.change30d?.toFixed(2) ?? 'N/A'}%
7d trend: ${ch.trend7d}
30d trend: ${ch.trend30d}
7d volatility: ${ch.volatility7d.toFixed(2)}% (daily std dev)
30d range: $${ch.highLow30d.low.toLocaleString()} — $${ch.highLow30d.high.toLocaleString()}
Position in range: ${(((c.currentPrice - ch.highLow30d.low) / (ch.highLow30d.high - ch.highLow30d.low || 1)) * 100).toFixed(0)}%

=== ATH CONTEXT ===
All-time high: $${c.ath.toLocaleString()}
Distance from ATH: ${c.athChangePercent.toFixed(1)}%

=== SUPPLY ===
Circulating: ${c.circulatingSupply ? (c.circulatingSupply / 1e6).toFixed(2) + 'M' : 'N/A'}
Total supply: ${c.totalSupply ? (c.totalSupply / 1e6).toFixed(2) + 'M' : 'N/A'}
Max supply: ${c.maxSupply ? (c.maxSupply / 1e6).toFixed(2) + 'M' : 'Unlimited'}
${c.maxSupply && c.circulatingSupply ? `Supply mined: ${((c.circulatingSupply / c.maxSupply) * 100).toFixed(1)}%` : ''}

=== MARKET SENTIMENT ===
Fear & Greed Index: ${ctx.market.fearGreed}/100 (${ctx.market.fearGreedLabel})`

  if (ctx.tvl) {
    message += `\n\n=== DeFi ===\nTotal Value Locked: $${(ctx.tvl / 1e9).toFixed(2)}B`
  }

  if (ctx.recentNews.length > 0) {
    message += `\n\n=== RECENT NEWS ===\n${ctx.recentNews.map((n) => `- ${n}`).join('\n')}`
  }

  return message
}

export interface ConvictionAgentResult {
  conviction: ConvictionOutput
  context: ConvictionContext
  cached: boolean
}

/**
 * Run the conviction agent for a specific coin.
 *
 * Pipeline: Check cache → Gather data → Analyse with Claude → Cache result → Return
 */
export async function runConvictionAgent(coinId: string): Promise<ConvictionAgentResult> {
  // 1. Check cache
  const cacheKey = CACHE_KEYS.conviction(coinId)
  const cachedResult = await redis.get<{ conviction: ConvictionOutput; context: ConvictionContext }>(cacheKey)
  if (cachedResult) {
    return { ...cachedResult, cached: true }
  }

  // 2. Gather all data in parallel
  const context = await gatherConvictionData(coinId)

  // 3. Call Claude with the full research brief
  const message = await anthropic.messages.create({
    model: NAV_MODEL,
    max_tokens: 800,
    system: [
      cached(NAV_PERSONA),
      cached(CONVICTION_AGENT_SYSTEM),
    ],
    messages: [{ role: 'user', content: buildUserMessage(context) }],
  })

  const raw = (message.content[0] as { text: string }).text.trim()
  const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  // 4. Validate structured output
  const conviction = ConvictionOutputSchema.parse(JSON.parse(jsonStr))

  // 5. Cache the full result (conviction + context for chart rendering)
  const result = { conviction, context }
  await redis.setex(cacheKey, TTL.CONVICTION, JSON.stringify(result))

  return { ...result, cached: false }
}
