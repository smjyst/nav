import { isValidEthAddress, getContractInfo, getTokenHolderCount } from '@/lib/api/etherscan'
import { searchCoins, getCoinDetail, getCoinByContract } from '@/lib/api/coingecko'
import { getTokenSecurity, summariseSecurity, type SecuritySummary } from '@/lib/api/goplus'
import type { ValidateContext } from './schema'

/**
 * Gather all available data for a token before sending to Claude.
 *
 * Resolution strategy (tries in order):
 *   1. If input looks like a contract address → CoinGecko contract lookup + Etherscan + GoPlusLabs
 *   2. If input looks like a name/symbol → CoinGecko search → enrich with detail
 *   3. Always try to get GoPlusLabs security data when we have a contract address
 */
export async function gatherValidateData(input: string): Promise<ValidateContext> {
  const trimmed = input.trim()
  const isEthContract = isValidEthAddress(trimmed)

  // Detect if it looks like any blockchain address (not just Ethereum)
  // Common patterns: 0x... (EVM), 1... or 5... (Polkadot), T... (Tron), bc1... (Bitcoin), etc.
  const looksLikeAddress = isEthContract || /^[13][a-km-zA-HJ-NP-Z1-9]{25,62}$/.test(trimmed) || /^[A-Za-z0-9]{32,64}$/.test(trimmed)

  const ctx: ValidateContext = {
    input: trimmed,
    inputType: isEthContract ? 'contract' : 'name',
  }

  if (isEthContract) {
    // ── EVM contract address path ──
    // Fire all lookups in parallel for speed
    const [contractInfo, holderCount, coinByContract, goplusSecurity] = await Promise.all([
      getContractInfo(trimmed).catch(() => null),
      getTokenHolderCount(trimmed).catch(() => 0),
      getCoinByContract(trimmed, 'ethereum').catch(() => null),
      getTokenSecurity(trimmed, 'ethereum').catch(() => null),
    ])

    // Etherscan data
    ctx.isContractVerified = contractInfo?.isVerified
    ctx.contractName = contractInfo?.contractName
    ctx.holderCount = holderCount

    // GoPlusLabs security data
    if (goplusSecurity) {
      ctx.security = summariseSecurity(goplusSecurity)

      // Use GoPlusLabs token name as fallback for resolution
      if (!ctx.resolvedName && goplusSecurity.token_name) {
        ctx.resolvedName = goplusSecurity.token_name
        ctx.resolvedSymbol = goplusSecurity.token_symbol
      }

      // GoPlusLabs holder count is often more accurate
      if (ctx.security.holderCount > 0) {
        ctx.holderCount = ctx.security.holderCount
      }
    }

    // CoinGecko contract lookup — best source for market data
    if (coinByContract) {
      enrichFromCoinDetail(ctx, coinByContract)
    } else if (contractInfo?.contractName) {
      // Fallback: search CoinGecko by contract name
      await trySearchAndEnrich(ctx, contractInfo.contractName)
    } else if (goplusSecurity?.token_name) {
      // Fallback: search CoinGecko by GoPlusLabs name
      await trySearchAndEnrich(ctx, goplusSecurity.token_name)
    }
  } else if (looksLikeAddress) {
    // ── Non-Ethereum address ──
    // We can't do Etherscan lookups, but we can try CoinGecko contract search
    // on other platforms
    ctx.inputType = 'contract'

    // Try known platforms
    for (const platform of ['ethereum', 'bsc', 'polygon', 'arbitrum', 'base']) {
      const coin = await getCoinByContract(trimmed, platform).catch(() => null)
      if (coin) {
        enrichFromCoinDetail(ctx, coin)
        break
      }
    }

    // Try GoPlusLabs on common EVM chains
    if (!ctx.resolvedName) {
      for (const chain of ['ethereum', 'bsc', 'polygon', 'arbitrum']) {
        const security = await getTokenSecurity(trimmed, chain).catch(() => null)
        if (security && security.token_name) {
          ctx.security = summariseSecurity(security)
          ctx.resolvedName = security.token_name
          ctx.resolvedSymbol = security.token_symbol
          if (ctx.security.holderCount > 0) ctx.holderCount = ctx.security.holderCount
          // Now try to find the coin on CoinGecko by name
          await trySearchAndEnrich(ctx, security.token_name)
          break
        }
      }
    }

    // If still unresolved, it might be a non-EVM address (Polkadot, Solana, etc.)
    // Try treating the input as a name search as a last resort
    if (!ctx.resolvedName) {
      // The user might have pasted a well-known address — search by common names
      // But more likely they just need to search by token name instead
      // Don't flag this as suspicious yet
    }
  } else {
    // ── Name/symbol search path ──
    await trySearchAndEnrich(ctx, trimmed)
  }

  return ctx
}

/** Try searching CoinGecko by name and enriching with full detail */
async function trySearchAndEnrich(ctx: ValidateContext, query: string): Promise<void> {
  try {
    const results = await searchCoins(query)
    if (results.length > 0) {
      const match = results[0]
      ctx.resolvedName = ctx.resolvedName || match.name
      ctx.resolvedSymbol = ctx.resolvedSymbol || match.symbol
      ctx.coinId = match.id
      ctx.thumb = match.thumb

      // Enrich with full detail
      const detail = await getCoinDetail(match.id).catch(() => null)
      if (detail) {
        enrichFromCoinDetail(ctx, detail)
      }
    }
  } catch {
    // Search failed — continue with whatever we have
  }
}

/** Populate context fields from a CoinGecko CoinDetail object */
function enrichFromCoinDetail(
  ctx: ValidateContext,
  detail: import('@/lib/api/coingecko').CoinDetail,
): void {
  const md = detail.market_data

  ctx.resolvedName = ctx.resolvedName || detail.name
  ctx.resolvedSymbol = ctx.resolvedSymbol || detail.symbol
  ctx.coinId = ctx.coinId || detail.id
  ctx.thumb = ctx.thumb || detail.image?.thumb

  ctx.price = md.current_price.usd
  ctx.marketCap = md.market_cap.usd
  ctx.volume24h = md.total_volume.usd
  ctx.change24h = md.price_change_percentage_24h
  ctx.change7d = md.price_change_percentage_7d
  ctx.change30d = md.price_change_percentage_30d
  ctx.athChangePercent = md.ath_change_percentage.usd
  ctx.rank = detail.market_cap_rank
  ctx.circulatingSupply = md.circulating_supply
  ctx.totalSupply = md.total_supply
  ctx.maxSupply = md.max_supply
  ctx.categories = detail.categories
  ctx.hasWebsite = (detail.links?.homepage ?? []).some((u) => u.length > 0)
  ctx.hasTwitter = !!detail.links?.twitter_screen_name
  ctx.hasGithub = !!detail.links?.github
}
