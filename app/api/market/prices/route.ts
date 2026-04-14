import { NextRequest, NextResponse } from 'next/server'
import { getTopCoins, getPrices } from '@/lib/api/coingecko'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get('ids')

  // If specific IDs requested, return simple price map
  if (ids) {
    const coinIds = ids.split(',').filter(Boolean)
    if (coinIds.length === 0) return NextResponse.json({})
    const prices = await getPrices(coinIds)
    return NextResponse.json(prices, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    })
  }

  // Default: return top 100 coins
  const coins = await getTopCoins(100)
  return NextResponse.json(coins, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
  })
}
