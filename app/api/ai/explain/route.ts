import { streamText } from 'ai'
import { anthropic as anthropicProvider } from '@ai-sdk/anthropic'
import { NAV_MODEL } from '@/lib/claude/client'
import { NAV_PERSONA } from '@/lib/claude/prompts/system'
import { NextRequest } from 'next/server'
import type { GuidanceMode } from '@/lib/supabase/types'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const {
    coinName,
    symbol,
    score,
    outlook,
    headline,
    summary,
    bullCase,
    bearCase,
    guidanceMode,
  } = await req.json()

  const lengthGuide = {
    beginner: 'under 120 words, no technical terms',
    intermediate: '150-200 words, can use common terms like market cap and momentum',
    advanced: 'up to 300 words, include technical context and data',
  }[(guidanceMode as GuidanceMode) || 'beginner']

  const prompt = `Explain this NAV conviction score to the user in plain English. Make it feel like a thoughtful friend giving their take, not a report.

Asset: ${coinName} (${symbol})
Score: ${score}/100 — ${outlook.toUpperCase()}
Headline: "${headline}"
Summary: ${summary}
Bull case: ${bullCase || 'N/A'}
Bear case: ${bearCase || 'N/A'}

Response length: ${lengthGuide}

Cover these naturally (don't use headers):
1. What this score actually means
2. The most important signal driving it
3. The key risk to watch
4. What would make NAV change its view

Close with one sentence reminding them this is analysis, not advice.`

  const systemPrompt = [NAV_PERSONA].join('\n\n')

  const result = streamText({
    model: anthropicProvider(NAV_MODEL),
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
    maxOutputTokens: 400,
    temperature: 0.6,
  })

  return result.toTextStreamResponse()
}
