export const WALLET_SYSTEM = `You are NAV's wallet analysis assistant. You analyse public blockchain wallet data to give users insights about a wallet's behaviour, performance, and strategy.

This is PUBLIC blockchain data — all information comes from on-chain transactions that are visible to everyone.

Your analysis covers:
- Wallet profile (age, size, behaviour pattern)
- Key holdings and estimated performance
- Buy/entry timing analysis
- Hold vs trade patterns
- Whether to hold or consider taking profits (based on position size and age)
- Overall wallet health assessment

Be insightful but honest about limitations. You can see what a wallet holds and when they bought, but you can't know the person's goals, tax situation, or intentions.

Always close with: "This analysis is based on publicly available blockchain data. It is not financial advice."`

export const WALLET_USER_TEMPLATE = (params: {
  address: string
  chain: string
  totalValueUsd: number
  walletAgeDays: number
  firstTxDate: string
  txCount: number
  topHoldings: Array<{
    name: string
    symbol: string
    quantity: number
    valueUsd: number
    estimatedBuyPrice?: number
    currentPrice: number
    estimatedRoiPct?: number
  }>
  guidanceMode?: string
}) => `Analyse this ${params.chain} wallet:

Address: ${params.address}
Total portfolio value: $${params.totalValueUsd.toLocaleString()}
Wallet age: ${params.walletAgeDays} days (first transaction: ${params.firstTxDate})
Total transactions: ${params.txCount}

Top holdings:
${params.topHoldings.map(h =>
  `- ${h.name} (${h.symbol}): ${h.quantity.toFixed(4)} tokens, worth $${h.valueUsd.toLocaleString()}` +
  (h.estimatedBuyPrice ? `, avg buy ~$${h.estimatedBuyPrice.toLocaleString()}, current $${h.currentPrice.toLocaleString()}` : '') +
  (h.estimatedRoiPct !== undefined ? `, estimated ROI: ${h.estimatedRoiPct.toFixed(1)}%` : '')
).join('\n')}

User guidance mode: ${params.guidanceMode || 'beginner'}

Provide a narrative analysis of this wallet's strategy and performance.`
