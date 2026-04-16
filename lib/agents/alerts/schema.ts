import { z } from 'zod'
import type { AlertType, AlertSeverity } from '@/lib/supabase/types'

// ── Alert configuration types ──

export interface PriceThresholdConfig {
  direction: 'above' | 'below'
  price: number
}

export interface ConvictionChangeConfig {
  changeThreshold: number // e.g. 15 = alert when score changes by ≥15 points
}

export interface PortfolioHealthConfig {
  drawdownThreshold: number // e.g. 10 = alert when portfolio drops 10%+
}

export interface WhaleMovementConfig {
  minValueUsd: number // e.g. 1000000 = alert on $1M+ movements
}

export type AlertConfig =
  | PriceThresholdConfig
  | ConvictionChangeConfig
  | PortfolioHealthConfig
  | WhaleMovementConfig
  | Record<string, unknown> // for scam_detection, risk_level etc.

// ── Alert event output from the scan agent ──

export const AlertEventSchema = z.object({
  alert_type: z.enum([
    'conviction_change',
    'price_threshold',
    'whale_movement',
    'risk_level',
    'portfolio_health',
    'scam_detection',
  ]),
  severity: z.enum(['info', 'warning', 'critical']),
  coin_id: z.string().nullable(),
  title: z.string(),
  body: z.string(),
  payload: z.record(z.unknown()).optional(),
})

export type AlertEvent = z.infer<typeof AlertEventSchema>

// ── Context for the alert scan agent ──

export interface AlertScanContext {
  // User's configured alerts
  configs: Array<{
    id: string
    alert_type: AlertType
    coin_id: string | null
    config: AlertConfig
    is_active: boolean
  }>

  // Current market snapshot
  prices: Record<string, { usd: number; usd_24h_change: number }>
  fearGreed: number

  // User's portfolio snapshot
  holdings: Array<{
    coin_id: string
    symbol: string
    name: string
    quantity: number
    average_buy_price: number | null
    currentPrice: number
    change24h: number
    value: number
  }>
  portfolioValue: number
  portfolioPnl24hPct: number

  // Cached conviction scores for watched coins
  convictions: Record<
    string,
    { score: number; outlook: string; previous_score?: number }
  >
}

// ── Alert preset templates ──

export interface AlertPreset {
  label: string
  description: string
  icon: string // lucide icon name
  alert_type: AlertType
  defaultConfig: AlertConfig
  requiresCoin: boolean
}

export const ALERT_PRESETS: AlertPreset[] = [
  {
    label: 'Price target',
    description: 'Get notified when a coin hits a specific price',
    icon: 'TrendingUp',
    alert_type: 'price_threshold',
    defaultConfig: { direction: 'above', price: 0 },
    requiresCoin: true,
  },
  {
    label: 'Conviction shift',
    description: 'Know when NAV changes its mind on a coin',
    icon: 'Activity',
    alert_type: 'conviction_change',
    defaultConfig: { changeThreshold: 15 },
    requiresCoin: true,
  },
  {
    label: 'Portfolio drawdown',
    description: 'Alert when your portfolio drops below a threshold',
    icon: 'ShieldAlert',
    alert_type: 'portfolio_health',
    defaultConfig: { drawdownThreshold: 10 },
    requiresCoin: false,
  },
  {
    label: 'Risk warning',
    description: 'Alerts when a coin you hold gets flagged as risky',
    icon: 'AlertTriangle',
    alert_type: 'risk_level',
    defaultConfig: {},
    requiresCoin: false,
  },
  {
    label: 'Scam detection',
    description: 'Get warned if a token in your watchlist turns suspicious',
    icon: 'ShieldX',
    alert_type: 'scam_detection',
    defaultConfig: {},
    requiresCoin: false,
  },
]
