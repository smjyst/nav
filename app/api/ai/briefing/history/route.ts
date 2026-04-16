import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// GET — list past briefings for the current user
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: briefings, error } = await supabase
    .from('daily_briefings')
    .select('id, briefing_date, generated_at, content')
    .eq('user_id', user.id)
    .order('briefing_date', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Return lightweight list (just date + headline) plus full content
  const list = (briefings ?? []).map((b) => {
    const content = b.content as Record<string, unknown> | null
    return {
      id: b.id,
      date: b.briefing_date,
      generatedAt: b.generated_at,
      headline: (content?.nav_take as string) ?? (content?.market_mood as string) ?? 'Briefing',
      sentiment: (content?.market_sentiment as string) ?? 'neutral',
      emoji: (content?.summary_emoji as string) ?? '📊',
      content,
    }
  })

  return NextResponse.json({ briefings: list })
}
