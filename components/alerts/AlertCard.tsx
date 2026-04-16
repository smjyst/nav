'use client'

import { motion } from 'framer-motion'
import {
  Bell,
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldAlert,
  ShieldX,
  Briefcase,
  AlertTriangle,
  Check,
} from 'lucide-react'
import { timeSince } from '@/lib/utils/formatting'
import type { AlertSeverity, AlertType } from '@/lib/supabase/types'

export interface AlertEventData {
  id: string
  alert_type: AlertType | string
  severity: AlertSeverity
  title: string
  body: string
  coin_id: string | null
  is_read: boolean
  created_at: string
  payload?: Record<string, unknown>
}

interface AlertCardProps {
  alert: AlertEventData
  onMarkRead: (id: string) => void
}

const ALERT_ICONS: Record<string, typeof Bell> = {
  conviction_change: Activity,
  price_threshold: TrendingUp,
  whale_movement: TrendingDown,
  risk_level: AlertTriangle,
  portfolio_health: Briefcase,
  scam_detection: ShieldX,
}

const SEVERITY_STYLES = {
  info: {
    border: 'border-l-[#6366f1]',
    iconColor: 'text-[#6366f1]',
    bg: '',
  },
  warning: {
    border: 'border-l-[#f59e0b]',
    iconColor: 'text-[#f59e0b]',
    bg: 'bg-[#78350f]/5',
  },
  critical: {
    border: 'border-l-[#ef4444]',
    iconColor: 'text-[#ef4444]',
    bg: 'bg-[#7f1d1d]/5',
  },
} as const

export default function AlertCard({ alert, onMarkRead }: AlertCardProps) {
  const Icon = ALERT_ICONS[alert.alert_type] ?? Bell
  const style = SEVERITY_STYLES[alert.severity]

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-start gap-3 p-4 rounded-xl border border-l-[3px] transition-colors ${
        alert.is_read
          ? 'bg-[#141414] border-[#1f1f1f] opacity-60'
          : `${style.bg} border-[#2a2a2a] ${style.border}`
      }`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          alert.is_read ? 'bg-[#1c1c1c]' : 'bg-[#1c1c1c]'
        }`}
      >
        <Icon
          size={14}
          className={alert.is_read ? 'text-[#4b5563]' : style.iconColor}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p
            className={`text-sm font-medium leading-snug ${
              alert.is_read ? 'text-[#6b7280]' : 'text-white'
            }`}
          >
            {alert.title}
          </p>
          <span className="text-[10px] text-[#4b5563] flex-shrink-0 mt-0.5">
            {timeSince(alert.created_at)}
          </span>
        </div>
        <p
          className={`text-xs leading-relaxed ${
            alert.is_read ? 'text-[#4b5563]' : 'text-[#9ca3af]'
          }`}
        >
          {alert.body}
        </p>

        {/* Quick actions */}
        {!alert.is_read && (
          <button
            onClick={() => onMarkRead(alert.id)}
            className="mt-2 flex items-center gap-1 text-[10px] text-[#6b7280] hover:text-[#9ca3af] transition-colors"
          >
            <Check size={10} />
            Mark as read
          </button>
        )}
      </div>
    </motion.div>
  )
}
