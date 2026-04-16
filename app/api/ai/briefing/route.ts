import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runPulseAgent } from '@/lib/agents/pulse'

export const runtime = 'nodejs'
export const maxDuration = 90

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]

  // Check cache — one briefing per user per day
  const { data: existing } = await supabase
    .from('daily_briefings')
    .select('id, content')
    .eq('user_id', user.id)
    .eq('briefing_date', today)
    .single()

  if (existing) {
    return NextResponse.json({ briefing: existing.content, cached: true })
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('guidance_mode, risk_profile')
    .eq('id', user.id)
    .single()

  const guidanceMode = profile?.guidance_mode ?? 'beginner'
  const riskProfile = profile?.risk_profile ?? 'moderate'

  // Get user holdings
  const { data: portfolios } = await supabase
    .from('portfolios')
    .select('*, holdings(*)')
    .eq('user_id', user.id)

  type HoldingRow = {
    coin_id: string
    symbol: string
    name: string
    quantity: number
    average_buy_price: number | null
  }

  const holdings =
    (portfolios?.[0] as { holdings: HoldingRow[] } | undefined)?.holdings ?? []

  try {
    const result = await runPulseAgent({
      holdings,
      guidanceMode,
      riskProfile,
    })

    // Store in database
    await supabase.from('daily_briefings').insert({
      user_id: user.id,
      briefing_date: today,
      content: result.pulse,
    })

    return NextResponse.json({ briefing: result.pulse, context: result.context, cached: false })
  } catch (err) {
    console.error('[pulse] Agent error:', err)
    return NextResponse.json(
      { error: 'Failed to generate briefing. Please try again.' },
      { status: 500 },
    )
  }
}
