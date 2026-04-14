import { streamText } from 'ai'
import { anthropic as anthropicProvider } from '@ai-sdk/anthropic'
import { NAV_MODEL } from '@/lib/claude/client'
import { NAV_PERSONA } from '@/lib/claude/prompts/system'
import { VALIDATE_SYSTEM, VALIDATE_USER_TEMPLATE } from '@/lib/claude/prompts/validate'
import { isValidEthAddress, getContractInfo, getTokenHolderCount } from '@/lib/api/etherscan'
import { searchCoins } from '@/lib/api/coingecko'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { input, guidanceMode } = await req.json()

  if (!input?.trim()) {
    return new Response('Input required', { status: 400 })
  }

  const trimmed = input.trim()
  const isContract = isValidEthAddress(trimmed)

  let contractData: {
    isContractVerified?: boolean
    holderCount?: number
    resolvedName?: string
  } = {}

  let coinData: {
    resolvedName?: string
    resolvedSymbol?: string
    price?: number
    marketCap?: number
    volume24h?: number
    change24h?: number
  } = {}

  // If it's a contract address, fetch on-chain data
  if (isContract) {
    const [contractInfo, holderCount] = await Promise.all([
      getContractInfo(trimmed).catch(() => null),
      getTokenHolderCount(trimmed).catch(() => 0),
    ])
    contractData = {
      isContractVerified: contractInfo?.isVerified,
      holderCount,
      resolvedName: contractInfo?.contractName,
    }
  } else {
    // Try to resolve by name/symbol search
    const results = await searchCoins(trimmed).catch(() => [])
    if (results.length > 0) {
      const match = results[0]
      coinData.resolvedName = match.name
      coinData.resolvedSymbol = match.symbol
    }
  }

  const userContent = VALIDATE_USER_TEMPLATE({
    input: trimmed,
    resolvedName: contractData.resolvedName || coinData.resolvedName,
    resolvedSymbol: coinData.resolvedSymbol,
    price: coinData.price,
    marketCap: coinData.marketCap,
    volume24h: coinData.volume24h,
    change24h: coinData.change24h,
    holderCount: contractData.holderCount,
    isContractVerified: contractData.isContractVerified,
    guidanceMode,
  })

  const result = streamText({
    model: anthropicProvider(NAV_MODEL),
    system: [NAV_PERSONA, VALIDATE_SYSTEM].join('\n\n'),
    messages: [{ role: 'user', content: userContent }],
    maxOutputTokens: 700,
    temperature: 0.4,
  })

  return result.toTextStreamResponse()
}
