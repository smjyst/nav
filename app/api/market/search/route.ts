import { searchCoins } from '@/lib/api/coingecko'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q || q.length < 2) {
    return NextResponse.json({ coins: [] })
  }

  const coins = await searchCoins(q).catch(() => [])
  return NextResponse.json({ coins })
}
