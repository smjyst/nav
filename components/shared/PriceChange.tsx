import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatChange, changePolarity } from '@/lib/utils/formatting'

interface PriceChangeProps {
  pct: number | null | undefined
  size?: 'sm' | 'md'
  showIcon?: boolean
  className?: string
}

export default function PriceChange({ pct, size = 'md', showIcon = false, className }: PriceChangeProps) {
  const polarity = changePolarity(pct)

  const colors = {
    positive: 'text-[#10b981]',
    negative: 'text-[#ef4444]',
    neutral:  'text-[#6b7280]',
  }

  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <span className={cn('inline-flex items-center gap-0.5 font-medium tabular-nums', colors[polarity], textSize, className)}>
      {showIcon && polarity === 'positive' && <TrendingUp size={12} />}
      {showIcon && polarity === 'negative' && <TrendingDown size={12} />}
      {showIcon && polarity === 'neutral' && <Minus size={12} />}
      {formatChange(pct)}
    </span>
  )
}
