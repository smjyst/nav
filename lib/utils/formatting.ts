// Currency formatting
export function formatUsd(value: number, decimals = 2): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  if (value >= 1) return `$${value.toFixed(decimals)}`
  if (value >= 0.01) return `$${value.toFixed(4)}`
  return `$${value.toFixed(8)}`
}

// Price change percentage
export function formatChange(pct: number | null | undefined, showSign = true): string {
  if (pct == null) return '—'
  const sign = showSign && pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(2)}%`
}

// Whether a price change is positive, negative, or neutral
export function changePolarity(pct: number | null | undefined): 'positive' | 'negative' | 'neutral' {
  if (pct == null || Math.abs(pct) < 0.01) return 'neutral'
  return pct > 0 ? 'positive' : 'negative'
}

// Large number abbreviation
export function formatLargeNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}

// Portfolio P&L display
export function formatPnl(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${formatUsd(Math.abs(value))}`
}

// Time since (e.g. "3 days ago")
export function timeSince(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(ms / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  const mo = Math.floor(d / 30)
  return `${mo}mo ago`
}

// Truncate wallet address
export function truncateAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2 + 2) return address
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

// Format token quantity (handles very small amounts)
export function formatQuantity(qty: number, symbol: string): string {
  if (qty >= 1_000_000) return `${formatLargeNumber(qty)} ${symbol}`
  if (qty >= 1) return `${qty.toFixed(4)} ${symbol}`
  if (qty >= 0.001) return `${qty.toFixed(6)} ${symbol}`
  return `${qty.toFixed(8)} ${symbol}`
}
