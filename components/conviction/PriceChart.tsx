'use client'

import { useState, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts'
import { cn } from '@/lib/utils/cn'

interface PriceChartProps {
  prices7d: number[]
  prices30d: number[]
  currentPrice: number
  support?: number
  resistance?: number
  className?: string
}

type TimeRange = '7d' | '30d'

function formatChartPrice(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`
  if (value >= 1) return `$${value.toFixed(2)}`
  if (value >= 0.01) return `$${value.toFixed(4)}`
  return `$${value.toFixed(6)}`
}

function formatTooltipPrice(value: number): string {
  if (value >= 1) return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (value >= 0.01) return `$${value.toFixed(4)}`
  return `$${value.toFixed(8)}`
}

export default function PriceChart({
  prices7d,
  prices30d,
  currentPrice,
  support,
  resistance,
  className,
}: PriceChartProps) {
  const [range, setRange] = useState<TimeRange>('30d')

  const data = useMemo(() => {
    const prices = range === '7d' ? prices7d : prices30d
    if (!prices.length) return []

    const totalPoints = prices.length
    const intervalMs = range === '7d' ? (7 * 24 * 60 * 60 * 1000) : (30 * 24 * 60 * 60 * 1000)
    const now = Date.now()
    const startTime = now - intervalMs

    return prices.map((price, i) => ({
      time: startTime + (i / (totalPoints - 1 || 1)) * intervalMs,
      price,
    }))
  }, [prices7d, prices30d, range])

  const priceChange = useMemo(() => {
    if (data.length < 2) return 0
    const first = data[0].price
    const last = data[data.length - 1].price
    return ((last - first) / first) * 100
  }, [data])

  const isPositive = priceChange >= 0
  const chartColor = isPositive ? '#10b981' : '#ef4444'
  const gradientId = `price-gradient-${range}`

  const minPrice = useMemo(() => Math.min(...data.map((d) => d.price)), [data])
  const maxPrice = useMemo(() => Math.max(...data.map((d) => d.price)), [data])
  const padding = (maxPrice - minPrice) * 0.05

  if (data.length === 0) {
    return (
      <div className={cn('bg-[#141414] border border-[#1f1f1f] rounded-xl p-5', className)}>
        <p className="text-sm text-[#6b7280] text-center py-8">No chart data available</p>
      </div>
    )
  }

  return (
    <div className={cn('bg-[#141414] border border-[#1f1f1f] rounded-xl p-5', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-[#6b7280] mb-0.5">Price</p>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-white tabular-nums">
              {formatTooltipPrice(currentPrice)}
            </span>
            <span
              className="text-xs font-medium tabular-nums"
              style={{ color: chartColor }}
            >
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Time range toggles */}
        <div className="flex bg-[#0a0a0a] rounded-lg p-0.5">
          {(['7d', '30d'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                range === r
                  ? 'bg-[#1c1c1c] text-white'
                  : 'text-[#6b7280] hover:text-[#9ca3af]',
              )}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.2} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />

            <XAxis
              dataKey="time"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(ts: number) => {
                const d = new Date(ts)
                return range === '7d'
                  ? d.toLocaleDateString('en', { weekday: 'short' })
                  : d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
              }}
              tick={{ fill: '#4b5563', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              minTickGap={40}
            />

            <YAxis
              domain={[minPrice - padding, maxPrice + padding]}
              tickFormatter={formatChartPrice}
              tick={{ fill: '#4b5563', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={55}
              orientation="right"
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#1c1c1c',
                border: '1px solid #2a2a2a',
                borderRadius: 8,
                padding: '8px 12px',
              }}
              labelStyle={{ color: '#6b7280', fontSize: 11 }}
              itemStyle={{ color: '#f9fafb', fontSize: 12, fontWeight: 600 }}
              labelFormatter={(ts: number) =>
                new Date(ts).toLocaleDateString('en', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              }
              formatter={(value: number) => [formatTooltipPrice(value), 'Price']}
            />

            {/* Support level */}
            {support && support >= minPrice - padding && (
              <ReferenceLine
                y={support}
                stroke="#10b981"
                strokeDasharray="6 4"
                strokeOpacity={0.5}
                label={{
                  value: `Support ${formatChartPrice(support)}`,
                  position: 'left',
                  fill: '#10b981',
                  fontSize: 9,
                }}
              />
            )}

            {/* Resistance level */}
            {resistance && resistance <= maxPrice + padding && (
              <ReferenceLine
                y={resistance}
                stroke="#ef4444"
                strokeDasharray="6 4"
                strokeOpacity={0.5}
                label={{
                  value: `Resistance ${formatChartPrice(resistance)}`,
                  position: 'left',
                  fill: '#ef4444',
                  fontSize: 9,
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="price"
              stroke={chartColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{
                r: 4,
                fill: chartColor,
                stroke: '#0a0a0a',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend for key levels */}
      {(support || resistance) && (
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#1f1f1f]">
          {support && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-px border-t border-dashed border-[#10b981]" />
              <span className="text-[10px] text-[#6b7280]">Support {formatChartPrice(support)}</span>
            </div>
          )}
          {resistance && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-px border-t border-dashed border-[#ef4444]" />
              <span className="text-[10px] text-[#6b7280]">Resistance {formatChartPrice(resistance)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
