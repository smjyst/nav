import { NextRequest, NextResponse } from 'next/server'
import { runConvictionAgent } from '@/lib/agents/conviction'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  let body: { coinId?: string; coin?: { id?: string } }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Support both { coinId: "zcash" } and legacy { coin: { id: "zcash" } }
  const coinId = body.coinId ?? body.coin?.id
  if (!coinId || typeof coinId !== 'string') {
    return NextResponse.json({ error: 'coinId required' }, { status: 400 })
  }

  try {
    const result = await runConvictionAgent(coinId)
    return NextResponse.json(result)
  } catch (err) {
    console.error('Conviction agent error:', err)
    return NextResponse.json(
      { error: 'Failed to generate conviction score' },
      { status: 500 },
    )
  }
}
