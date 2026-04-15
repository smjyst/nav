import { streamText } from 'ai'
import { anthropicProvider, NAV_MODEL } from '@/lib/claude/client'
import { NextRequest } from 'next/server'
import type { GuidanceMode } from '@/lib/supabase/types'

export const runtime = 'nodejs'
export const maxDuration = 30

const EXPLAIN_PERSONA = `You are the voice of NAV — an AI research partner that helps everyday people understand crypto markets.

Your tone is like a favourite teacher: warm, calm, and genuinely interested in helping someone understand. You respect their intelligence. You never talk down to them, never say "don't worry" or "it's actually quite simple" — those phrases make people feel small.

Instead you:
- Talk to them like an equal who happens to have more context on this specific thing
- Lead with the most interesting or important insight, not the obvious stuff
- Use concrete analogies when something is abstract — but never forced or cutesy ones
- Acknowledge when things are genuinely uncertain, because honesty builds trust
- Keep your language natural and human — contractions, conversational rhythm, the way you'd actually talk

Never use bullet points or headers. Write in flowing paragraphs — this is a conversation, not a report.
Never start with "Great question!" or similar filler.
Never end with "Let me know if you have any questions!" — the follow-up questions handle that.
End with a single natural sentence reminding them this is analysis, not financial advice — but make it feel organic, not like a legal disclaimer.`

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

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
    followUpQuestion,
  } = body as {
    coinName: string
    symbol: string
    score: number
    outlook: string
    headline: string
    summary: string
    bullCase?: string
    bearCase?: string
    guidanceMode?: string
    followUpQuestion?: string
  }

  const lengthGuide = {
    beginner: 'Keep it under 120 words. Skip jargon entirely — if you must use a term, weave the definition into the sentence naturally.',
    intermediate: '150-200 words. You can reference concepts like market cap, momentum, and support levels without defining them, but keep the tone conversational.',
    advanced: 'Up to 250 words. Include the technical context — reference the data points, trends, and what they mean structurally. Still conversational, not a report.',
  }[(guidanceMode as GuidanceMode) || 'beginner']

  let prompt: string

  if (followUpQuestion) {
    // Follow-up question — answer this specific question in context
    prompt = `The user is looking at NAV's conviction score for ${coinName} (${symbol}).

Score: ${score}/100 — ${outlook.toUpperCase()}
Headline: "${headline}"
Summary: ${summary}
${bullCase ? `Bull case: ${bullCase}` : ''}
${bearCase ? `Bear case: ${bearCase}` : ''}

They've already seen the initial explanation and now they're asking:
"${followUpQuestion}"

Answer their specific question directly and helpfully. Stay in context — reference the conviction data where relevant. ${lengthGuide}

Remember: warm, calm, like a great teacher talking to a smart person. No headers, no bullets, just natural paragraphs.`
  } else {
    // Initial explanation
    prompt = `Walk the user through this conviction score for ${coinName} (${symbol}). Help them understand what NAV is seeing and why it matters.

Score: ${score}/100 — ${outlook.toUpperCase()}
Headline: "${headline}"
Summary: ${summary}
${bullCase ? `Bull case: ${bullCase}` : ''}
${bearCase ? `Bear case: ${bearCase}` : ''}

${lengthGuide}

Cover these things naturally — weave them in, don't list them:
- What this score actually tells them (not just the number, but what it means in practice)
- The one or two signals that matter most right now
- The key risk they should be aware of
- What would change this picture (what NAV is watching for)

Write like you're sitting next to them, pointing at a screen and walking them through it. Start with the most interesting insight, not "This score of X means..."`
  }

  const result = streamText({
    model: anthropicProvider(NAV_MODEL),
    system: EXPLAIN_PERSONA,
    messages: [{ role: 'user', content: prompt }],
    maxOutputTokens: 350,
    temperature: 0.65,
  })

  return result.toTextStreamResponse()
}
