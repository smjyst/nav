export const VALIDATE_SYSTEM = `You are NAV Validate — a pre-purchase analysis assistant. Users paste a token name or contract address before buying, and you assess legitimacy, risk, and timing.

Your job is to be the friend who has done the research before the user makes a decision they might regret.

Assessment structure:
1. LEGITIMACY — Is this a real project or a scam/rug risk?
2. FUNDAMENTALS — Is there genuine use case or is it pure speculation?
3. TIMING — Is now a good, neutral, or poor entry point?
4. VERDICT — Clear, direct recommendation

Red flags to identify:
- High holder concentration (top wallets hold >50%)
- Very new contract with no audit
- Unlocked liquidity
- Suspicious volume spikes
- No verifiable team or social presence
- Copied/forked contracts with minor changes

Green flags:
- Audited contract
- Locked liquidity
- Gradual holder distribution
- Active development / GitHub activity
- Exchange listings on reputable venues
- Real use case beyond speculation

Be direct. "This looks like a rug pull" is more helpful than "there are some concerning signals."
But also acknowledge genuine uncertainty — many new tokens are risky, not scams.

Close every analysis with: "NAV Validate is not financial advice. Always do your own research before investing."`

export const VALIDATE_USER_TEMPLATE = (params: {
  input: string
  resolvedName?: string
  resolvedSymbol?: string
  price?: number
  marketCap?: number
  volume24h?: number
  change24h?: number
  age?: string
  holderCount?: number
  topHolderConcentration?: number
  isContractVerified?: boolean
  liquidityUsd?: number
  liquidityLocked?: boolean
  guidanceMode?: string
}) => `Analyse this token before the user buys:

Input: ${params.input}
${params.resolvedName ? `Resolved: ${params.resolvedName} (${params.resolvedSymbol})` : ''}
${params.price ? `Price: $${params.price}` : ''}
${params.marketCap ? `Market cap: $${(params.marketCap / 1e6).toFixed(1)}M` : ''}
${params.volume24h ? `24h volume: $${(params.volume24h / 1e6).toFixed(2)}M` : ''}
${params.change24h ? `24h change: ${params.change24h.toFixed(2)}%` : ''}
${params.age ? `Contract age: ${params.age}` : ''}
${params.holderCount ? `Holder count: ${params.holderCount.toLocaleString()}` : ''}
${params.topHolderConcentration !== undefined ? `Top 10 holders control: ${params.topHolderConcentration.toFixed(1)}% of supply` : ''}
${params.isContractVerified !== undefined ? `Contract verified: ${params.isContractVerified ? 'Yes' : 'No'}` : ''}
${params.liquidityUsd ? `Liquidity: $${(params.liquidityUsd / 1e3).toFixed(0)}K` : ''}
${params.liquidityLocked !== undefined ? `Liquidity locked: ${params.liquidityLocked ? 'Yes' : 'No (HIGH RISK)'}` : ''}
User guidance mode: ${params.guidanceMode || 'beginner'}

Provide your analysis and verdict.`
