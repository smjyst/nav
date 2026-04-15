import { z } from 'zod'

// ── Structured output schema for the validate agent ──

export const ValidateOutputSchema = z.object({
  verdict: z.enum(['safe', 'caution', 'danger']),
  legitimacy_score: z.number().int().min(0).max(100),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']),

  headline: z.string(), // max ~15 words
  summary: z.string(), // 2-4 sentences plain English

  red_flags: z.array(
    z.object({
      label: z.string(),
      detail: z.string(),
      severity: z.enum(['warning', 'danger']),
    }),
  ),
  green_flags: z.array(
    z.object({
      label: z.string(),
      detail: z.string(),
    }),
  ),

  timing: z.object({
    assessment: z.enum(['early', 'mid', 'late', 'unknown']),
    detail: z.string(),
  }),

  category: z.string(), // e.g. "Layer 1", "Meme coin", "DeFi", "Unknown"
  recommendation: z.string(), // 1-2 sentences: what should the user do?
})

export type ValidateOutput = z.infer<typeof ValidateOutputSchema>

// ── Context gathered before calling Claude ──

export interface ValidateContext {
  input: string
  inputType: 'contract' | 'name'

  // Resolved identity
  resolvedName?: string
  resolvedSymbol?: string
  coinId?: string
  thumb?: string

  // On-chain data (contract addresses only)
  isContractVerified?: boolean
  contractName?: string
  holderCount?: number

  // GoPlusLabs security analysis
  security?: import('@/lib/api/goplus').SecuritySummary

  // Market data (if resolved via CoinGecko)
  price?: number
  marketCap?: number
  volume24h?: number
  change24h?: number
  change7d?: number
  change30d?: number
  athChangePercent?: number
  rank?: number
  circulatingSupply?: number
  totalSupply?: number | null
  maxSupply?: number | null
  categories?: string[]
  hasWebsite?: boolean
  hasTwitter?: boolean
  hasGithub?: boolean
}
