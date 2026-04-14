import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import type { Json } from '@/lib/supabase/types'

const CreateConfigSchema = z.object({
  coin_id: z.string().min(1).nullable(),
  alert_type: z.enum(['conviction_change', 'price_threshold', 'whale_movement', 'risk_level', 'portfolio_health', 'scam_detection']),
  config: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])),
})

// GET — list user's alert configs
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: configs } = await supabase
    .from('alert_configs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ configs: configs ?? [] })
}

// POST — create a new alert config
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = CreateConfigSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data: config, error } = await supabase
    .from('alert_configs')
    .insert({
      user_id: user.id,
      coin_id: parsed.data.coin_id,
      alert_type: parsed.data.alert_type,
      config: parsed.data.config as Json,
      is_active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ config }, { status: 201 })
}

// DELETE — remove an alert config
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = z.object({ id: z.string().uuid() }).safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { id } = parsed.data

  const { error } = await supabase
    .from('alert_configs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
