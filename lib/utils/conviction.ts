import type { ConvictionOutlook, ConvictionConfidence } from '@/lib/supabase/types'

export interface ConvictionColors {
  text: string
  bg: string
  border: string
  arc: string
}

export function getConvictionColors(outlook: ConvictionOutlook): ConvictionColors {
  switch (outlook) {
    case 'bull':
      return {
        text: '#10b981',
        bg: '#064e3b',
        border: '#10b981',
        arc: '#10b981',
      }
    case 'bear':
      return {
        text: '#ef4444',
        bg: '#7f1d1d',
        border: '#ef4444',
        arc: '#ef4444',
      }
    case 'neutral':
      return {
        text: '#6b7280',
        bg: '#1f2937',
        border: '#6b7280',
        arc: '#6b7280',
      }
  }
}

export function getConvictionLabel(score: number): ConvictionOutlook {
  if (score >= 67) return 'bull'
  if (score >= 34) return 'neutral'
  return 'bear'
}

export function getConfidenceLabel(confidence: ConvictionConfidence): string {
  const labels: Record<ConvictionConfidence, string> = {
    low: 'Low confidence',
    medium: 'Medium confidence',
    high: 'High confidence',
  }
  return labels[confidence]
}

export function getConfidenceDots(confidence: ConvictionConfidence): number {
  const dots: Record<ConvictionConfidence, number> = { low: 1, medium: 2, high: 3 }
  return dots[confidence]
}

// Score → arc percentage for the SVG gauge (0–100 maps to 0–270 degrees)
export function scoreToArcPercent(score: number): number {
  return Math.max(0, Math.min(100, score))
}
