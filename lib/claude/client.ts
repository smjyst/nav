import Anthropic from '@anthropic-ai/sdk'

// Singleton Anthropic client — used in all route handlers
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const NAV_MODEL = 'claude-sonnet-4-6'

// Helper: wrap content as a cacheable system block
// Attach to large, stable system prompt segments to reduce cost/latency.
export function cached(text: string): Anthropic.TextBlockParam & { cache_control: { type: 'ephemeral' } } {
  return {
    type: 'text',
    text,
    cache_control: { type: 'ephemeral' },
  }
}
