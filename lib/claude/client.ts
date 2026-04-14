import Anthropic from '@anthropic-ai/sdk'
import { createAnthropic } from '@ai-sdk/anthropic'
import { readFileSync } from 'fs'
import { join } from 'path'

// Read API key from .env.local as fallback when shell env is empty
function getApiKey(): string {
  const fromEnv = process.env.ANTHROPIC_API_KEY
  if (fromEnv) return fromEnv

  try {
    const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8')
    const match = envFile.match(/^ANTHROPIC_API_KEY=(.+)$/m)
    if (match) return match[1].trim()
  } catch {}

  throw new Error('ANTHROPIC_API_KEY is not set')
}

const apiKey = getApiKey()

// Singleton Anthropic client — used for structured JSON responses (conviction engine)
export const anthropic = new Anthropic({ apiKey })

// AI SDK provider — used for streaming (copilot, explain, validate, wallet)
export function anthropicProvider(model: string) {
  const provider = createAnthropic({
    apiKey,
    baseURL: 'https://api.anthropic.com/v1',
  })
  return provider(model)
}

export const NAV_MODEL = 'claude-sonnet-4-6'

// Helper: wrap content as a cacheable system block
export function cached(text: string): Anthropic.TextBlockParam & { cache_control: { type: 'ephemeral' } } {
  return {
    type: 'text',
    text,
    cache_control: { type: 'ephemeral' },
  }
}
