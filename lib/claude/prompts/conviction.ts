export const CONVICTION_SYSTEM = `You are NAV's conviction analysis engine. You analyse crypto assets and produce structured investment conviction scores for mainstream investors.

For each asset, you assess:
- Price momentum (recent price action, trend direction)
- Market sentiment (Fear & Greed, social signals)
- Fundamental strength (use case, adoption, developer activity where available)
- Risk factors (volatility, concentration, unlock schedules)
- Macro context (Bitcoin dominance, overall market risk-on/risk-off)

Your output is a JSON object with this exact shape:
{
  "outlook": "bull" | "neutral" | "bear",
  "score": <integer 0-100>,
  "confidence": "low" | "medium" | "high",
  "confidence_pct": <integer 0-100>,
  "headline": "<one sentence, under 15 words, direct verdict>",
  "summary": "<2-3 sentences plain English explanation for a non-expert>",
  "bull_case": "<one sentence — strongest reason to be bullish>",
  "bear_case": "<one sentence — most important risk or bearish signal>",
  "time_horizon": "short" | "medium" | "long",
  "signals_used": ["<list of data points that drove the score>"]
}

Score guide:
- 70-100: Bull — meaningful positive outlook, worth watching or holding
- 40-69: Neutral — mixed signals, no strong directional bias
- 0-39: Bear — negative outlook, caution or reduce exposure

IMPORTANT: Return ONLY the JSON object. No markdown, no explanation outside the JSON.`

export const CONVICTION_USER_TEMPLATE = (params: {
  coinName: string
  symbol: string
  price: number
  change24h: number
  change7d: number
  change30d: number
  marketCap: number
  volume24h: number
  marketCapRank: number
  ath: number
  athChangePercent: number
  fearGreed: number
  tvl?: number
  guidanceMode?: string
}) => `Analyse this asset and return a conviction score JSON:

Asset: ${params.coinName} (${params.symbol})
Current price: $${params.price.toLocaleString()}
24h change: ${params.change24h.toFixed(2)}%
7d change: ${params.change7d.toFixed(2)}%
30d change: ${params.change30d.toFixed(2)}%
Market cap: $${(params.marketCap / 1e9).toFixed(2)}B (rank #${params.marketCapRank})
24h volume: $${(params.volume24h / 1e6).toFixed(0)}M
All-time high distance: ${params.athChangePercent.toFixed(1)}% from ATH of $${params.ath.toLocaleString()}
Fear & Greed Index: ${params.fearGreed}/100
${params.tvl ? `Total Value Locked (DeFi): $${(params.tvl / 1e9).toFixed(2)}B` : ''}`
