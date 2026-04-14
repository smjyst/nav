import { NextResponse } from 'next/server'
import { getFearGreed } from '@/lib/api/alternative'

export const runtime = 'nodejs'

export async function GET() {
  const data = await getFearGreed()
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' },
  })
}
