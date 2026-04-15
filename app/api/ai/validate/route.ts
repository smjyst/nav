import { runValidateAgent } from '@/lib/agents/validate'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  let body: { input?: string; guidanceMode?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { input, guidanceMode } = body

  if (!input?.trim()) {
    return NextResponse.json({ error: 'Input required' }, { status: 400 })
  }

  try {
    const result = await runValidateAgent(input.trim(), guidanceMode || 'beginner')
    return NextResponse.json(result)
  } catch (err) {
    console.error('[validate] Agent error:', err)
    return NextResponse.json(
      { error: 'Failed to analyse token. Please try again.' },
      { status: 500 },
    )
  }
}
