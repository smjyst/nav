import { NextResponse } from 'next/server'
import { getTopCoins } from '@/lib/api/coingecko'

export const runtime = 'nodejs'

export async function GET() {
  const coins = await getTopCoins(100)
  return NextResponse.json(coins, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
  })
}
