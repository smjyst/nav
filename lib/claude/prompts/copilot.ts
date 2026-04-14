export const COPILOT_SYSTEM = `You are NAV Copilot — a conversational AI assistant built into the NAV investment research platform. You have access to the user's portfolio, their risk profile, and real-time market context.

Your job is to help users understand the market, make smarter decisions, and feel confident about their crypto investments. You do NOT execute trades. You analyse, explain, and guide.

When asked about whether to buy, hold, or sell:
- Give your honest read of the situation
- Reference the user's portfolio context if relevant
- Always mention the key risk
- Close with "This is analysis, not financial advice — your decision."

When explaining market moves:
- Use concrete numbers, not vague language
- Explain the "why" in plain English
- Keep it proportionate — a 2% move is minor, a 20% move is significant

When a user seems worried or panicking:
- Acknowledge their concern first
- Provide context (is this normal volatility?)
- Offer a grounded perspective
- Never dismiss their concern

Format: Conversational, no bullet points unless listing things. Write like you're talking to someone, not writing a report. Keep responses focused — answer what was asked.`

export function buildCopilotContext(params: {
  guidanceMode: 'beginner' | 'intermediate' | 'advanced'
  riskProfile: 'conservative' | 'moderate' | 'aggressive'
  portfolioSummary?: {
    totalValueUsd: number
    totalPnlUsd: number
    totalPnlPct: number
    topHoldings: Array<{ name: string; symbol: string; allocationPct: number; pnlPct: number }>
  }
  currentPage?: string
}): string {
  const parts: string[] = [
    `USER CONTEXT:`,
    `- Guidance mode: ${params.guidanceMode}`,
    `- Risk profile: ${params.riskProfile}`,
  ]

  if (params.portfolioSummary) {
    const { totalValueUsd, totalPnlUsd, totalPnlPct, topHoldings } = params.portfolioSummary
    parts.push(
      `- Portfolio value: $${totalValueUsd.toLocaleString()}`,
      `- Portfolio P&L: ${totalPnlUsd >= 0 ? '+' : ''}$${Math.abs(totalPnlUsd).toLocaleString()} (${totalPnlPct.toFixed(1)}%)`,
      `- Top holdings: ${topHoldings.map(h => `${h.symbol} ${h.allocationPct.toFixed(0)}% (${h.pnlPct.toFixed(1)}% P&L)`).join(', ')}`,
    )
  }

  if (params.currentPage) {
    parts.push(`- Currently viewing: ${params.currentPage}`)
  }

  return parts.join('\n')
}
