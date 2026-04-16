import type { AlertScanContext, AlertEvent, PriceThresholdConfig, ConvictionChangeConfig, PortfolioHealthConfig } from './schema'

/**
 * Scan all active alert configs against current market data.
 * Returns a list of alert events that should be fired.
 *
 * This runs server-side — called by the alerts API route or a cron job.
 */
export function scanAlerts(ctx: AlertScanContext): AlertEvent[] {
  const events: AlertEvent[] = []

  for (const config of ctx.configs) {
    if (!config.is_active) continue

    switch (config.alert_type) {
      case 'price_threshold':
        scanPriceThreshold(ctx, config, events)
        break
      case 'conviction_change':
        scanConvictionChange(ctx, config, events)
        break
      case 'portfolio_health':
        scanPortfolioHealth(ctx, config, events)
        break
      case 'risk_level':
        scanRiskLevel(ctx, config, events)
        break
      default:
        break
    }
  }

  return events
}

// ── Price threshold ──

function scanPriceThreshold(
  ctx: AlertScanContext,
  config: AlertScanContext['configs'][0],
  events: AlertEvent[],
) {
  if (!config.coin_id) return
  const priceData = ctx.prices[config.coin_id]
  if (!priceData) return

  const cfg = config.config as PriceThresholdConfig
  const currentPrice = priceData.usd

  if (cfg.direction === 'above' && currentPrice >= cfg.price) {
    events.push({
      alert_type: 'price_threshold',
      severity: 'info',
      coin_id: config.coin_id,
      title: `${config.coin_id.toUpperCase()} hit $${cfg.price.toLocaleString()}`,
      body: `${config.coin_id} is now trading at $${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} — above your $${cfg.price.toLocaleString()} target.`,
      payload: { currentPrice, target: cfg.price, direction: 'above' },
    })
  }

  if (cfg.direction === 'below' && currentPrice <= cfg.price) {
    events.push({
      alert_type: 'price_threshold',
      severity: 'warning',
      coin_id: config.coin_id,
      title: `${config.coin_id.toUpperCase()} dropped below $${cfg.price.toLocaleString()}`,
      body: `${config.coin_id} is now trading at $${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} — below your $${cfg.price.toLocaleString()} floor.`,
      payload: { currentPrice, target: cfg.price, direction: 'below' },
    })
  }
}

// ── Conviction change ──

function scanConvictionChange(
  ctx: AlertScanContext,
  config: AlertScanContext['configs'][0],
  events: AlertEvent[],
) {
  if (!config.coin_id) return
  const conviction = ctx.convictions[config.coin_id]
  if (!conviction || conviction.previous_score === undefined) return

  const cfg = config.config as ConvictionChangeConfig
  const delta = conviction.score - conviction.previous_score

  if (Math.abs(delta) >= cfg.changeThreshold) {
    const direction = delta > 0 ? 'improved' : 'dropped'
    const severity = Math.abs(delta) >= 30 ? 'critical' : 'warning'

    events.push({
      alert_type: 'conviction_change',
      severity,
      coin_id: config.coin_id,
      title: `NAV Signal ${direction} for ${config.coin_id}`,
      body: `Conviction score moved from ${conviction.previous_score} to ${conviction.score} (${delta > 0 ? '+' : ''}${delta} points). Outlook: ${conviction.outlook.toUpperCase()}.`,
      payload: {
        previousScore: conviction.previous_score,
        newScore: conviction.score,
        delta,
        outlook: conviction.outlook,
      },
    })
  }
}

// ── Portfolio health ──

function scanPortfolioHealth(
  ctx: AlertScanContext,
  config: AlertScanContext['configs'][0],
  events: AlertEvent[],
) {
  const cfg = config.config as PortfolioHealthConfig
  if (ctx.portfolioValue === 0) return

  if (ctx.portfolioPnl24hPct <= -cfg.drawdownThreshold) {
    events.push({
      alert_type: 'portfolio_health',
      severity: ctx.portfolioPnl24hPct <= -(cfg.drawdownThreshold * 2) ? 'critical' : 'warning',
      coin_id: null,
      title: `Portfolio down ${Math.abs(ctx.portfolioPnl24hPct).toFixed(1)}% today`,
      body: `Your portfolio has declined ${Math.abs(ctx.portfolioPnl24hPct).toFixed(1)}% in the last 24 hours. Total value: $${ctx.portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}.`,
      payload: {
        portfolioValue: ctx.portfolioValue,
        pnl24hPct: ctx.portfolioPnl24hPct,
      },
    })
  }
}

// ── Risk level changes ──

function scanRiskLevel(
  ctx: AlertScanContext,
  _config: AlertScanContext['configs'][0],
  events: AlertEvent[],
) {
  // Check Fear & Greed extremes
  if (ctx.fearGreed <= 15) {
    events.push({
      alert_type: 'risk_level',
      severity: 'warning',
      coin_id: null,
      title: 'Extreme Fear in the market',
      body: `The Fear & Greed Index is at ${ctx.fearGreed}/100 — extreme fear. Historically this can signal buying opportunities, but also means high volatility.`,
      payload: { fearGreed: ctx.fearGreed },
    })
  } else if (ctx.fearGreed >= 85) {
    events.push({
      alert_type: 'risk_level',
      severity: 'warning',
      coin_id: null,
      title: 'Extreme Greed in the market',
      body: `The Fear & Greed Index is at ${ctx.fearGreed}/100 — extreme greed. Markets may be overheated. Consider taking profits or pausing new investments.`,
      payload: { fearGreed: ctx.fearGreed },
    })
  }

  // Check individual holdings for major drops
  for (const holding of ctx.holdings) {
    if (holding.change24h <= -15) {
      events.push({
        alert_type: 'risk_level',
        severity: holding.change24h <= -25 ? 'critical' : 'warning',
        coin_id: holding.coin_id,
        title: `${holding.name} down ${Math.abs(holding.change24h).toFixed(1)}%`,
        body: `${holding.name} (${holding.symbol.toUpperCase()}) has dropped ${Math.abs(holding.change24h).toFixed(1)}% in the last 24 hours. You hold ${holding.quantity} ${holding.symbol.toUpperCase()} worth $${holding.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}.`,
        payload: {
          coinId: holding.coin_id,
          change24h: holding.change24h,
          value: holding.value,
          quantity: holding.quantity,
        },
      })
    }
  }
}
