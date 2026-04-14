import { cachedFetch, TTL } from '@/lib/redis/client'

const BASE = 'https://api.llama.fi'

// Get TVL for a specific protocol by slug
export async function getProtocolTVL(slug: string): Promise<number | null> {
  return cachedFetch(
    `nav:tvl:${slug}`,
    TTL.TVL,
    async () => {
      try {
        const res = await fetch(`${BASE}/protocol/${slug}`)
        if (!res.ok) return null
        const data = await res.json()
        return data.tvl as number
      } catch {
        return null
      }
    }
  )
}

// Get TVL for all chains
export async function getChainTVLs(): Promise<Array<{ name: string; tvl: number }>> {
  return cachedFetch(
    'nav:tvl:chains',
    TTL.TVL,
    async () => {
      const res = await fetch(`${BASE}/v2/chains`)
      if (!res.ok) throw new Error('DeFiLlama chains error')
      return res.json()
    }
  )
}

// Map common CoinGecko IDs to DeFiLlama slugs
const COINGECKO_TO_DEFILLAMA: Record<string, string> = {
  uniswap: 'uniswap',
  aave: 'aave',
  'curve-dao-token': 'curve',
  'compound-governance-token': 'compound',
  maker: 'makerdao',
  'lido-dao': 'lido',
  'rocket-pool': 'rocketpool',
  chainlink: 'chainlink',
  'the-graph': 'the-graph',
}

export function defillamaSlug(coinId: string): string | null {
  return COINGECKO_TO_DEFILLAMA[coinId] ?? null
}
