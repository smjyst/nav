import { anthropic, NAV_MODEL, cached } from '@/lib/claude/client'
import { NAV_PERSONA } from '@/lib/claude/prompts/system'
import { gatherValidateData } from './gather'
import { ValidateOutputSchema, type ValidateOutput, type ValidateContext } from './schema'

export type { ValidateOutput, ValidateContext }

// ── System prompt for the validate agent ──

const VALIDATE_AGENT_SYSTEM = `You are NAV Validate — a pre-purchase analysis agent that assesses crypto tokens for legitimacy, risk, and timing before users invest.

Think of yourself as the friend who does the research. Your job is to protect people from scams, help them understand risk, and give a clear opinion.

## ANALYSIS FRAMEWORK

1. **Identity & Legitimacy**
   - Is this a real, established project? Or new/unknown/suspicious?
   - Contract verification status (verified = good sign, unverified = caution)
   - Presence: website, Twitter, GitHub, exchange listings
   - Market cap rank — top 100 is established, 100-500 is mid-tier, 500+ is speculative, unranked is high risk

2. **Risk Assessment**
   - Holder concentration — few wallets holding most supply = manipulation risk
   - Volume relative to market cap — suspiciously high volume can signal wash trading
   - Distance from ATH — how much has it already dropped? Could signal a dead project or a buying opportunity
   - Supply dynamics — is there a max supply? Is most supply already circulating?
   - Category risk — meme coins are inherently higher risk than L1s or DeFi protocols

3. **Entry Timing**
   - Early: low market cap, new but legitimate project, before major catalysts
   - Mid: established but still growing, price near fair value
   - Late: near ATH, saturated market awareness, most upside already priced in
   - Unknown: not enough data to assess

4. **Red/Green Flags**
   - Be specific. "Contract is unverified on Etherscan" not just "unverified contract"
   - Severity: "warning" for caution items, "danger" for serious risks
   - Include at least 1 flag in each direction when possible (nothing is 100% safe or 100% dangerous)

## SCORING GUIDE

- **legitimacy_score 80-100**: Well-established, multi-year track record, exchange-listed, community verified
- **legitimacy_score 60-79**: Legitimate project with some concerns or limited track record
- **legitimacy_score 40-59**: Uncertain — could be real but significant unknowns
- **legitimacy_score 20-39**: Suspicious — multiple red flags, high risk of loss
- **legitimacy_score 0-19**: Almost certainly a scam or dead project

## OUTPUT FORMAT

Return a single JSON object — no markdown, no text outside the JSON:

{
  "verdict": "safe" | "caution" | "danger",
  "legitimacy_score": <0-100>,
  "risk_level": "low" | "medium" | "high" | "critical",
  "headline": "<max 15 words — the verdict in plain English>",
  "summary": "<2-4 sentences explaining what you found, written for a non-expert>",
  "red_flags": [{ "label": "<short label>", "detail": "<1 sentence>", "severity": "warning" | "danger" }],
  "green_flags": [{ "label": "<short label>", "detail": "<1 sentence>" }],
  "timing": { "assessment": "early" | "mid" | "late" | "unknown", "detail": "<1 sentence>" },
  "category": "<e.g. Layer 1, Meme coin, DeFi, NFT, Unknown>",
  "recommendation": "<1-2 sentences: what should the user do?>"
}

Be direct. "This looks like a rug pull" is more helpful than "there are some concerning signals."
But also acknowledge genuine uncertainty — many new tokens are risky, not scams.`

// ── Build the user prompt from gathered context ──

function buildUserPrompt(ctx: ValidateContext, guidanceMode: string): string {
  const lines: string[] = [`Analyse this token for the user (guidance mode: ${guidanceMode}):\n`]

  lines.push(`User input: ${ctx.input}`)
  lines.push(`Input type: ${ctx.inputType}`)

  if (ctx.resolvedName) {
    lines.push(`Resolved: ${ctx.resolvedName}${ctx.resolvedSymbol ? ` (${ctx.resolvedSymbol.toUpperCase()})` : ''}`)
  }

  // On-chain data
  if (ctx.isContractVerified !== undefined) {
    lines.push(`Contract verified on Etherscan: ${ctx.isContractVerified ? 'Yes' : 'No'}`)
  }
  if (ctx.contractName) {
    lines.push(`Contract name: ${ctx.contractName}`)
  }
  if (ctx.holderCount) {
    lines.push(`Token holders: ${ctx.holderCount.toLocaleString()}`)
  }

  // GoPlusLabs security analysis
  if (ctx.security) {
    lines.push('\n--- ON-CHAIN SECURITY ANALYSIS (from GoPlusLabs) ---')
    lines.push(`Honeypot: ${ctx.security.isHoneypot ? 'YES ⚠️' : 'No'}`)
    lines.push(`Open source contract: ${ctx.security.isOpenSource ? 'Yes' : 'No'}`)
    lines.push(`Mintable: ${ctx.security.isMintable ? 'Yes' : 'No'}`)
    lines.push(`Proxy contract: ${ctx.security.isProxy ? 'Yes' : 'No'}`)
    lines.push(`Transfers pausable: ${ctx.security.canPause ? 'Yes' : 'No'}`)
    lines.push(`Blacklist function: ${ctx.security.canBlacklist ? 'Yes' : 'No'}`)
    if (ctx.security.buyTaxPercent > 0) lines.push(`Buy tax: ${ctx.security.buyTaxPercent.toFixed(1)}%`)
    if (ctx.security.sellTaxPercent > 0) lines.push(`Sell tax: ${ctx.security.sellTaxPercent.toFixed(1)}%`)
    if (ctx.security.topHolderPercent > 0) lines.push(`Top holder (non-contract, unlocked): ${ctx.security.topHolderPercent.toFixed(1)}% of supply`)
    lines.push(`Liquidity locked: ${ctx.security.hasLockedLiquidity ? 'Yes' : 'No'}`)
    if (ctx.security.liquidityUsd > 0) lines.push(`DEX liquidity: $${formatLargeNumber(ctx.security.liquidityUsd)}`)
    if (ctx.security.riskSignals.length > 0) {
      lines.push(`Automated risk signals: ${ctx.security.riskSignals.join('; ')}`)
    } else {
      lines.push('Automated risk signals: None detected')
    }
  }

  // Market data
  if (ctx.price !== undefined) lines.push(`\nPrice: $${ctx.price}`)
  if (ctx.marketCap) lines.push(`Market cap: $${formatLargeNumber(ctx.marketCap)}`)
  if (ctx.rank) lines.push(`Market cap rank: #${ctx.rank}`)
  if (ctx.volume24h) lines.push(`24h volume: $${formatLargeNumber(ctx.volume24h)}`)
  if (ctx.change24h !== undefined) lines.push(`24h change: ${ctx.change24h.toFixed(2)}%`)
  if (ctx.change7d !== undefined) lines.push(`7d change: ${ctx.change7d.toFixed(2)}%`)
  if (ctx.change30d !== undefined) lines.push(`30d change: ${ctx.change30d.toFixed(2)}%`)
  if (ctx.athChangePercent !== undefined) lines.push(`Distance from ATH: ${ctx.athChangePercent.toFixed(1)}%`)

  // Supply
  if (ctx.circulatingSupply) {
    lines.push(`Circulating supply: ${formatLargeNumber(ctx.circulatingSupply)}`)
  }
  if (ctx.totalSupply) {
    lines.push(`Total supply: ${formatLargeNumber(ctx.totalSupply)}`)
  }
  if (ctx.maxSupply) {
    lines.push(`Max supply: ${formatLargeNumber(ctx.maxSupply)}`)
  }

  // Presence
  if (ctx.hasWebsite !== undefined) lines.push(`Has website: ${ctx.hasWebsite ? 'Yes' : 'No'}`)
  if (ctx.hasTwitter !== undefined) lines.push(`Has Twitter: ${ctx.hasTwitter ? 'Yes' : 'No'}`)
  if (ctx.hasGithub !== undefined) lines.push(`Has GitHub: ${ctx.hasGithub ? 'Yes' : 'No'}`)

  if (ctx.categories && ctx.categories.length > 0) {
    lines.push(`Categories: ${ctx.categories.join(', ')}`)
  }

  // If we couldn't resolve anything
  if (!ctx.resolvedName && !ctx.contractName) {
    lines.push(`\nℹ️ Could not resolve this input to a known token via CoinGecko or on-chain data. This could mean:`)
    lines.push(`- The address belongs to a chain we don't cover yet (we check Ethereum, BSC, Polygon, Arbitrum, Base)`)
    lines.push(`- The token is very new and not yet indexed`)
    lines.push(`- The input may be misspelled`)
    lines.push(`- It could genuinely be an unknown or fraudulent token`)
    lines.push(`\nWeigh the lack of data as ONE factor, not the only factor. If the token is on a chain we don't cover (e.g. Solana, Polkadot native), tell the user we couldn't verify it but that doesn't necessarily mean it's a scam.`)
  }

  return lines.join('\n')
}

function formatLargeNumber(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return n.toFixed(2)
}

// ── Main agent entry point ──

export interface ValidateAgentResult {
  validation: ValidateOutput
  context: ValidateContext
}

export async function runValidateAgent(
  input: string,
  guidanceMode: string = 'beginner',
): Promise<ValidateAgentResult> {
  // 1. Gather data
  const ctx = await gatherValidateData(input)

  // 2. Call Claude for structured analysis
  const userPrompt = buildUserPrompt(ctx, guidanceMode)

  const response = await anthropic.messages.create({
    model: NAV_MODEL,
    max_tokens: 1200,
    temperature: 0.3,
    system: [
      cached(NAV_PERSONA),
      cached(VALIDATE_AGENT_SYSTEM),
    ],
    messages: [{ role: 'user', content: userPrompt }],
  })

  // 3. Parse structured output
  const text =
    response.content[0].type === 'text' ? response.content[0].text : ''

  // Extract JSON from the response (handle potential markdown wrapping)
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Validate agent returned non-JSON response')
  }

  const parsed = JSON.parse(jsonMatch[0])
  const validation = ValidateOutputSchema.parse(parsed)

  return { validation, context: ctx }
}
