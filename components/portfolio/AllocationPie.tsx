'use client'

import type { HoldingWithPrice } from './HoldingsTable'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316']

interface AllocationPieProps {
  holdings: HoldingWithPrice[]
}

export default function AllocationPie({ holdings }: AllocationPieProps) {
  const withValues = holdings
    .map((h) => ({
      ...h,
      value: (h.current_price ?? 0) * h.quantity,
    }))
    .filter((h) => h.value > 0)
    .sort((a, b) => b.value - a.value)

  const total = withValues.reduce((sum, h) => sum + h.value, 0)
  if (total === 0) return null

  // Build SVG arcs
  const size = 160
  const radius = 60
  const center = size / 2
  let cumAngle = -90 // start from top

  const arcs = withValues.map((h, i) => {
    const pct = h.value / total
    const angle = pct * 360
    const startAngle = cumAngle
    const endAngle = cumAngle + angle
    cumAngle = endAngle

    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180
    const x1 = center + radius * Math.cos(startRad)
    const y1 = center + radius * Math.sin(startRad)
    const x2 = center + radius * Math.cos(endRad)
    const y2 = center + radius * Math.sin(endRad)
    const largeArc = angle > 180 ? 1 : 0

    const d = withValues.length === 1
      ? `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center - 0.01} ${center - radius}`
      : `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`

    return { d, color: COLORS[i % COLORS.length], symbol: h.symbol, pct, value: h.value }
  })

  return (
    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
      <p className="text-xs text-[#6b7280] font-medium uppercase tracking-wider mb-3">Allocation</p>
      <div className="flex items-center gap-4">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {arcs.map((arc, i) => (
            <path key={i} d={arc.d} fill={arc.color} stroke="#0a0a0a" strokeWidth={1.5} />
          ))}
          {/* Center hole */}
          <circle cx={center} cy={center} r={38} fill="#141414" />
        </svg>

        {/* Legend */}
        <div className="flex-1 space-y-1.5">
          {arcs.slice(0, 6).map((arc, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: arc.color }} />
              <span className="text-xs text-white uppercase flex-1">{arc.symbol}</span>
              <span className="text-xs text-[#6b7280] tabular-nums">{(arc.pct * 100).toFixed(1)}%</span>
            </div>
          ))}
          {arcs.length > 6 && (
            <p className="text-xs text-[#4b5563]">+{arcs.length - 6} more</p>
          )}
        </div>
      </div>
    </div>
  )
}
