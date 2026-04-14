import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

// POST — Check for conviction changes and generate alerts
// Called by cron/Edge Functions — requires CRON_SECRET auth
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Get all current conviction scores
  const { data: currentScores } = await supabase
    .from('conviction_scores')
    .select('coin_id, symbol, outlook, score, headline')
    .order('computed_at', { ascending: false })

  if (!currentScores || currentScores.length === 0) {
    return NextResponse.json({ alerts: 0 })
  }

  // Deduplicate: keep only the most recent score per coin
  const latestByCoins = new Map<string, typeof currentScores[0]>()
  for (const s of currentScores) {
    if (!latestByCoins.has(s.coin_id)) {
      latestByCoins.set(s.coin_id, s)
    }
  }

  // Get all users who have conviction_change alerts enabled
  const { data: alertConfigs } = await supabase
    .from('alert_configs')
    .select('id, user_id, coin_id, config')
    .eq('alert_type', 'conviction_change')
    .eq('is_active', true)

  if (!alertConfigs || alertConfigs.length === 0) {
    return NextResponse.json({ alerts: 0 })
  }

  // Get users' watchlists and holdings to know which coins matter
  const userIds = [...new Set(alertConfigs.map((c) => c.user_id))]
  const { data: holdings } = await supabase
    .from('holdings')
    .select('coin_id, portfolio_id, portfolios!inner(user_id)')

  // Map user to their coins
  const userCoins = new Map<string, Set<string>>()
  if (holdings) {
    for (const h of holdings) {
      const userId = (h as unknown as { portfolios: { user_id: string } }).portfolios.user_id
      if (!userCoins.has(userId)) userCoins.set(userId, new Set())
      userCoins.get(userId)!.add(h.coin_id)
    }
  }

  // Generate alerts for significant score changes
  type AlertSeverity = 'info' | 'warning' | 'critical'
  const alertEvents: Array<{
    user_id: string
    alert_config_id: string
    coin_id: string
    alert_type: string
    severity: AlertSeverity
    title: string
    body: string
    payload: Record<string, string | number>
  }> = []

  for (const config of alertConfigs) {
    const relevantCoins = config.coin_id
      ? [config.coin_id]
      : [...(userCoins.get(config.user_id) ?? [])]

    for (const coinId of relevantCoins) {
      const score = latestByCoins.get(coinId)
      if (!score) continue

      // Check if outlook changed recently (score extremes indicate strong signal)
      if (score.score >= 75 || score.score <= 25) {
        const severity: AlertSeverity =
          score.score >= 85 || score.score <= 15 ? 'critical' :
          score.score >= 75 || score.score <= 25 ? 'warning' : 'info'
        const direction = score.outlook === 'bull' ? 'bullish' : score.outlook === 'bear' ? 'bearish' : 'neutral'

        alertEvents.push({
          user_id: config.user_id,
          alert_config_id: config.id,
          coin_id: coinId,
          alert_type: 'conviction_change',
          severity,
          title: `${score.symbol.toUpperCase()} conviction: ${score.score}/100 ${direction}`,
          body: score.headline,
          payload: { outlook: score.outlook, score: score.score },
        })
      }
    }
  }

  // Insert alerts (skip if already sent today)
  let inserted = 0
  const today = new Date().toISOString().split('T')[0]

  for (const alert of alertEvents) {
    // Check for duplicate today
    const { data: existing } = await supabase
      .from('alert_events')
      .select('id')
      .eq('user_id', alert.user_id)
      .eq('coin_id', alert.coin_id)
      .eq('alert_type', 'conviction_change')
      .gte('created_at', `${today}T00:00:00Z`)
      .limit(1)

    if (existing && existing.length > 0) continue

    const { error: insertError } = await supabase.from('alert_events').insert(alert)
    if (insertError) {
      console.error('Failed to insert alert:', insertError)
      continue
    }
    inserted++
  }

  return NextResponse.json({ alerts: inserted })
}
