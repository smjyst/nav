import { streamText } from 'ai'
import { anthropicProvider, NAV_MODEL } from '@/lib/claude/client'
import { NAV_PERSONA } from '@/lib/claude/prompts/system'
import { WALLET_SYSTEM, WALLET_USER_TEMPLATE } from '@/lib/claude/prompts/wallet'
import { isValidEthAddress, getTransactions, getEthBalance } from '@/lib/api/etherscan'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 90

export async function POST(req: NextRequest) {
  const { address, chain = 'ethereum', guidanceMode } = await req.json()

  if (!address || !isValidEthAddress(address)) {
    return new Response('Invalid Ethereum address', { status: 400 })
  }

  // Fetch transaction history
  const [transactions, ethBalanceWei] = await Promise.all([
    getTransactions(address).catch(() => []),
    getEthBalance(address).catch(() => '0'),
  ])

  const ethBalance = parseInt(ethBalanceWei, 10) / 1e18

  // Compute wallet age from first transaction
  const firstTx = transactions[0]
  const firstTxDate = firstTx
    ? new Date(parseInt(firstTx.timeStamp, 10) * 1000).toISOString().split('T')[0]
    : 'Unknown'
  const walletAgeDays = firstTx
    ? Math.floor((Date.now() - parseInt(firstTx.timeStamp, 10) * 1000) / (1000 * 60 * 60 * 24))
    : 0

  const userContent = WALLET_USER_TEMPLATE({
    address,
    chain,
    totalValueUsd: ethBalance * 3000, // approximate, real price fetched client-side
    walletAgeDays,
    firstTxDate,
    txCount: transactions.length,
    topHoldings: [
      {
        name: 'Ethereum',
        symbol: 'ETH',
        quantity: ethBalance,
        valueUsd: ethBalance * 3000,
        currentPrice: 3000,
      },
    ],
    guidanceMode,
  })

  const result = streamText({
    model: anthropicProvider(NAV_MODEL),
    system: [NAV_PERSONA, WALLET_SYSTEM].join('\n\n'),
    messages: [{ role: 'user', content: userContent }],
    maxOutputTokens: 700,
    temperature: 0.5,
  })

  return result.toTextStreamResponse()
}
