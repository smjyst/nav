import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'

const ScheduleSchema = z.object({
  briefing_enabled: z.boolean().optional(),
  briefing_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM format')
    .optional(),
})

// GET — current schedule settings
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('briefing_enabled, briefing_time, timezone')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    enabled: profile?.briefing_enabled ?? false,
    time: profile?.briefing_time ?? '08:00',
    timezone: profile?.timezone ?? 'UTC',
  })
}

// PATCH — update schedule
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = ScheduleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const updates: { briefing_enabled?: boolean; briefing_time?: string } = {}
  if (parsed.data.briefing_enabled !== undefined) {
    updates.briefing_enabled = parsed.data.briefing_enabled
  }
  if (parsed.data.briefing_time !== undefined) {
    updates.briefing_time = parsed.data.briefing_time
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, ...updates })
}
