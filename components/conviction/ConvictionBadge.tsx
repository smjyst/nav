import { getConvictionColors } from '@/lib/utils/conviction'
import { cn } from '@/lib/utils/cn'
import type { ConvictionOutlook } from '@/lib/supabase/types'

interface ConvictionBadgeProps {
  outlook: ConvictionOutlook
  score?: number
  className?: string
}

const LABELS: Record<ConvictionOutlook, string> = {
  bull: 'BULL',
  bear: 'BEAR',
  neutral: 'NEUTRAL',
}

export default function ConvictionBadge({ outlook, score, className }: ConvictionBadgeProps) {
  const colors = getConvictionColors(outlook)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold tracking-wide',
        className,
      )}
      style={{
        backgroundColor: `${colors.text}1A`, // 10% opacity
        color: colors.text,
        border: `1px solid ${colors.text}33`, // 20% opacity
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: colors.text }}
      />
      {LABELS[outlook]}
      {score !== undefined && <span className="opacity-75">{score}</span>}
    </span>
  )
}
