'use client'

import { useState } from 'react'
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  ShieldX,
  Briefcase,
  Trash2,
  Bell,
} from 'lucide-react'
import type { AlertType } from '@/lib/supabase/types'

interface AlertConfigData {
  id: string
  alert_type: AlertType
  coin_id: string | null
  config: Record<string, unknown>
  is_active: boolean
  created_at: string
}

interface AlertConfigCardProps {
  config: AlertConfigData
  onDelete: (id: string) => void
}

const TYPE_META: Record<
  string,
  { label: string; icon: typeof Bell; color: string }
> = {
  price_threshold: {
    label: 'Price target',
    icon: TrendingUp,
    color: 'text-[#6366f1]',
  },
  conviction_change: {
    label: 'Conviction shift',
    icon: Activity,
    color: 'text-[#818cf8]',
  },
  portfolio_health: {
    label: 'Portfolio drawdown',
    icon: Briefcase,
    color: 'text-[#f59e0b]',
  },
  risk_level: {
    label: 'Risk warning',
    icon: AlertTriangle,
    color: 'text-[#f59e0b]',
  },
  scam_detection: {
    label: 'Scam detection',
    icon: ShieldX,
    color: 'text-[#ef4444]',
  },
  whale_movement: {
    label: 'Whale movement',
    icon: ShieldAlert,
    color: 'text-[#6b7280]',
  },
}

function describeConfig(type: AlertType, config: Record<string, unknown>, coinId: string | null): string {
  const coin = coinId?.toUpperCase() ?? ''

  switch (type) {
    case 'price_threshold': {
      const dir = config.direction === 'above' ? 'goes above' : 'falls below'
      return `${coin} ${dir} $${Number(config.price).toLocaleString()}`
    }
    case 'conviction_change':
      return `${coin} score changes by ${config.changeThreshold ?? 15}+ points`
    case 'portfolio_health':
      return `Portfolio drops ${config.drawdownThreshold ?? 10}%+`
    case 'risk_level':
      return 'Extreme market conditions or large drops in held coins'
    case 'scam_detection':
      return 'Suspicious activity on watchlisted tokens'
    default:
      return 'Active'
  }
}

export default function AlertConfigCard({ config, onDelete }: AlertConfigCardProps) {
  const [deleting, setDeleting] = useState(false)
  const meta = TYPE_META[config.alert_type] ?? {
    label: config.alert_type,
    icon: Bell,
    color: 'text-[#6b7280]',
  }
  const Icon = meta.icon

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch('/api/alerts/configs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: config.id }),
      })
      if (res.ok) onDelete(config.id)
    } catch {
      // Silently fail
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#141414] border border-[#1f1f1f]">
      <div className="w-8 h-8 rounded-lg bg-[#1c1c1c] flex items-center justify-center flex-shrink-0">
        <Icon size={14} className={meta.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white">{meta.label}</p>
        <p className="text-[11px] text-[#6b7280] truncate">
          {describeConfig(config.alert_type, config.config as Record<string, unknown>, config.coin_id)}
        </p>
      </div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="p-1.5 rounded-md text-[#4b5563] hover:text-[#ef4444] hover:bg-[#7f1d1d]/20 transition-colors disabled:opacity-30"
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}
