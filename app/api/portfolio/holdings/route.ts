import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const AddHoldingSchema = z.object({
  coin_id: z.string().min(1),
  symbol: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().positive(),
  average_buy_price: z.number().positive().nullable().optional(),
})

const UpdateHoldingSchema = z.object({
  id: z.string().uuid(),
  quantity: z.number().positive().optional(),
  average_buy_price: z.number().positive().nullable().optional(),
})

const DeleteHoldingSchema = z.object({
  id: z.string().uuid(),
})

// GET — fetch user's holdings with current prices
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get or create default portfolio
  let { data: portfolio } = await supabase
    .from('portfolios')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_default', true)
    .single()

  if (!portfolio) {
    const { data: newPortfolio } = await supabase
      .from('portfolios')
      .insert({ user_id: user.id, name: 'My Portfolio', is_default: true })
      .select('id')
      .single()
    portfolio = newPortfolio
  }

  if (!portfolio) return NextResponse.json({ error: 'Failed to create portfolio' }, { status: 500 })

  const { data: holdings } = await supabase
    .from('holdings')
    .select('*')
    .eq('portfolio_id', portfolio.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ holdings: holdings ?? [], portfolioId: portfolio.id })
}

// POST — add a new holding
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = AddHoldingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Get or create default portfolio
  let { data: portfolio } = await supabase
    .from('portfolios')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_default', true)
    .single()

  if (!portfolio) {
    const { data: newPortfolio } = await supabase
      .from('portfolios')
      .insert({ user_id: user.id, name: 'My Portfolio', is_default: true })
      .select('id')
      .single()
    portfolio = newPortfolio
  }

  if (!portfolio) return NextResponse.json({ error: 'Failed to create portfolio' }, { status: 500 })

  // Check if holding already exists for this coin
  const { data: existing } = await supabase
    .from('holdings')
    .select('id, quantity, average_buy_price')
    .eq('portfolio_id', portfolio.id)
    .eq('coin_id', parsed.data.coin_id)
    .single()

  if (existing) {
    // Merge: weighted average buy price, sum quantities
    const oldQty = existing.quantity
    const newQty = parsed.data.quantity
    const totalQty = oldQty + newQty
    const oldPrice = existing.average_buy_price ?? 0
    const newPrice = parsed.data.average_buy_price ?? 0
    const avgPrice = oldPrice != null && oldPrice > 0 && newPrice != null && newPrice > 0 && totalQty > 0
      ? (oldPrice * oldQty + newPrice * newQty) / totalQty
      : newPrice ?? oldPrice ?? null

    const { data: updated, error } = await supabase
      .from('holdings')
      .update({ quantity: totalQty, average_buy_price: avgPrice })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ holding: updated, merged: true })
  }

  const { data: holding, error } = await supabase
    .from('holdings')
    .insert({
      portfolio_id: portfolio.id,
      coin_id: parsed.data.coin_id,
      symbol: parsed.data.symbol,
      name: parsed.data.name,
      quantity: parsed.data.quantity,
      average_buy_price: parsed.data.average_buy_price ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ holding }, { status: 201 })
}

// PATCH — update a holding
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = UpdateHoldingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Verify the holding belongs to this user's portfolio
  const { data: existing } = await supabase
    .from('holdings')
    .select('id, portfolios!inner(user_id)')
    .eq('id', parsed.data.id)
    .single()

  if (!existing || (existing as unknown as { portfolios: { user_id: string } }).portfolios.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const update: { quantity?: number; average_buy_price?: number | null } = {}
  if (parsed.data.quantity !== undefined) update.quantity = parsed.data.quantity
  if (parsed.data.average_buy_price !== undefined) update.average_buy_price = parsed.data.average_buy_price

  const { data: holding, error } = await supabase
    .from('holdings')
    .update(update)
    .eq('id', parsed.data.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ holding })
}

// DELETE — remove a holding
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = DeleteHoldingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Verify the holding belongs to this user's portfolio
  const { data: existing } = await supabase
    .from('holdings')
    .select('id, portfolios!inner(user_id)')
    .eq('id', parsed.data.id)
    .single()

  if (!existing || (existing as unknown as { portfolios: { user_id: string } }).portfolios.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('holdings')
    .delete()
    .eq('id', parsed.data.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
