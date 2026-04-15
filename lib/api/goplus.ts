import { cachedFetch } from '@/lib/redis/client'

/**
 * GoPlusLabs Token Security API
 *
 * Free, no API key required.
 * Covers: Ethereum, BSC, Polygon, Arbitrum, Avalanche, Base, Optimism, and more.
 * Docs: https://docs.gopluslabs.io/reference/token-security-api
 */

const BASE = 'https://api.gopluslabs.io/api/v1'

// Chain ID mapping for GoPlusLabs
export const GOPLUS_CHAINS: Record<string, string> = {
  ethereum: '1',
  bsc: '56',
  polygon: '137',
  arbitrum: '42161',
  optimism: '10',
  avalanche: '43114',
  base: '8453',
  fantom: '250',
  cronos: '25',
  gnosis: '100',
}

export interface GoPlusTokenSecurity {
  // Identity
  token_name?: string
  token_symbol?: string
  total_supply?: string

  // Contract security
  is_open_source?: string        // "1" = yes, "0" = no
  is_proxy?: string              // "1" = proxy contract
  is_mintable?: string           // "1" = can mint new tokens
  can_take_back_ownership?: string
  owner_change_balance?: string  // owner can modify balances
  hidden_owner?: string
  selfdestruct?: string
  external_call?: string

  // Trading restrictions
  is_honeypot?: string           // "1" = can't sell (scam)
  buy_tax?: string               // e.g. "0.05" = 5% tax
  sell_tax?: string
  cannot_buy?: string
  cannot_sell_all?: string
  slippage_modifiable?: string
  is_blacklisted?: string
  is_whitelisted?: string
  trading_cooldown?: string
  transfer_pausable?: string
  is_anti_whale?: string

  // Holder info
  holder_count?: string
  lp_holder_count?: string
  lp_total_supply?: string
  is_true_token?: string
  is_airdrop_scam?: string

  // Top holders
  holders?: Array<{
    address: string
    tag?: string
    is_contract: number
    balance: string
    percent: string
    is_locked: number
  }>

  // Liquidity
  lp_holders?: Array<{
    address: string
    tag?: string
    is_contract: number
    balance: string
    percent: string
    is_locked: number
  }>

  // DEX info
  dex?: Array<{
    name: string
    liquidity?: string
    pair?: string
  }>
}

/**
 * Get token security analysis from GoPlusLabs.
 * Returns null if the token isn't found or the API fails.
 */
export async function getTokenSecurity(
  contractAddress: string,
  chain: string = 'ethereum',
): Promise<GoPlusTokenSecurity | null> {
  const chainId = GOPLUS_CHAINS[chain]
  if (!chainId) return null

  const key = `nav:goplus:${chain}:${contractAddress.toLowerCase()}`

  return cachedFetch(key, 30 * 60, async () => {
    try {
      const res = await fetch(
        `${BASE}/token_security/${chainId}?contract_addresses=${contractAddress.toLowerCase()}`,
      )
      if (!res.ok) return null

      const data = await res.json()
      if (data.code !== 1 || !data.result) return null

      const addr = contractAddress.toLowerCase()
      return (data.result[addr] as GoPlusTokenSecurity) ?? null
    } catch {
      return null
    }
  })
}

/**
 * Summarise GoPlusLabs security data into a structured risk profile.
 */
export interface SecuritySummary {
  isHoneypot: boolean
  isOpenSource: boolean
  isMintable: boolean
  isProxy: boolean
  canPause: boolean
  canBlacklist: boolean
  buyTaxPercent: number
  sellTaxPercent: number
  holderCount: number
  lpHolderCount: number
  topHolderPercent: number // percentage held by top holder (non-contract, non-locked)
  hasLockedLiquidity: boolean
  liquidityUsd: number
  riskSignals: string[] // human-readable list of concerns
}

export function summariseSecurity(data: GoPlusTokenSecurity): SecuritySummary {
  const risks: string[] = []

  const isHoneypot = data.is_honeypot === '1'
  if (isHoneypot) risks.push('Honeypot detected — tokens cannot be sold')

  const isOpenSource = data.is_open_source === '1'
  if (!isOpenSource) risks.push('Contract source code is not verified/open source')

  const isMintable = data.is_mintable === '1'
  if (isMintable) risks.push('Token supply can be increased (mintable)')

  const isProxy = data.is_proxy === '1'
  if (isProxy) risks.push('Proxy contract — code can be changed by owner')

  const canPause = data.transfer_pausable === '1'
  if (canPause) risks.push('Transfers can be paused by the owner')

  const canBlacklist = data.is_blacklisted === '1'
  if (canBlacklist) risks.push('Owner can blacklist addresses from trading')

  const buyTax = parseFloat(data.buy_tax || '0') * 100
  const sellTax = parseFloat(data.sell_tax || '0') * 100
  if (buyTax > 5) risks.push(`High buy tax: ${buyTax.toFixed(1)}%`)
  if (sellTax > 5) risks.push(`High sell tax: ${sellTax.toFixed(1)}%`)
  if (sellTax > 50) risks.push('Extremely high sell tax — likely a scam')

  if (data.owner_change_balance === '1') {
    risks.push('Owner can modify token balances')
  }
  if (data.hidden_owner === '1') {
    risks.push('Contract has a hidden owner')
  }
  if (data.selfdestruct === '1') {
    risks.push('Contract can self-destruct')
  }
  if (data.can_take_back_ownership === '1') {
    risks.push('Ownership can be reclaimed after being renounced')
  }
  if (data.cannot_sell_all === '1') {
    risks.push('Cannot sell full token balance')
  }
  if (data.is_airdrop_scam === '1') {
    risks.push('Flagged as an airdrop scam token')
  }

  const holderCount = parseInt(data.holder_count || '0', 10)
  const lpHolderCount = parseInt(data.lp_holder_count || '0', 10)

  // Top holder concentration (non-contract, non-locked)
  let topHolderPercent = 0
  if (data.holders && data.holders.length > 0) {
    const nonContractHolders = data.holders.filter(
      (h) => h.is_contract === 0 && h.is_locked === 0,
    )
    if (nonContractHolders.length > 0) {
      topHolderPercent = parseFloat(nonContractHolders[0].percent) * 100
    }
  }
  if (topHolderPercent > 20) {
    risks.push(`Top wallet holds ${topHolderPercent.toFixed(1)}% of supply`)
  }

  // Liquidity lock check
  const hasLockedLiquidity =
    data.lp_holders?.some((lp) => lp.is_locked === 1) ?? false
  if (!hasLockedLiquidity && data.lp_holders && data.lp_holders.length > 0) {
    risks.push('Liquidity is not locked — rug pull risk')
  }

  // Total liquidity estimate
  let liquidityUsd = 0
  if (data.dex) {
    for (const d of data.dex) {
      liquidityUsd += parseFloat(d.liquidity || '0')
    }
  }
  if (liquidityUsd > 0 && liquidityUsd < 10000) {
    risks.push(`Very low liquidity: $${liquidityUsd.toFixed(0)}`)
  }

  return {
    isHoneypot,
    isOpenSource,
    isMintable,
    isProxy,
    canPause,
    canBlacklist,
    buyTaxPercent: buyTax,
    sellTaxPercent: sellTax,
    holderCount,
    lpHolderCount,
    topHolderPercent,
    hasLockedLiquidity,
    liquidityUsd,
    riskSignals: risks,
  }
}
