'use client'

import { motion } from 'framer-motion'
import { Shield, ShieldAlert, ShieldX } from 'lucide-react'

interface ValidateVerdictProps {
  verdict: 'safe' | 'caution' | 'danger'
  legitimacyScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  headline: string
  category: string
}

const VERDICT_CONFIG = {
  safe: {
    icon: Shield,
    label: 'Looks Safe',
    bg: 'bg-[#064e3b]/30',
    border: 'border-[#10b981]/30',
    iconColor: 'text-[#10b981]',
    barColor: '#10b981',
    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.1)]',
  },
  caution: {
    icon: ShieldAlert,
    label: 'Use Caution',
    bg: 'bg-[#78350f]/20',
    border: 'border-[#f59e0b]/30',
    iconColor: 'text-[#f59e0b]',
    barColor: '#f59e0b',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.1)]',
  },
  danger: {
    icon: ShieldX,
    label: 'High Risk',
    bg: 'bg-[#7f1d1d]/20',
    border: 'border-[#ef4444]/30',
    iconColor: 'text-[#ef4444]',
    barColor: '#ef4444',
    glow: 'shadow-[0_0_30px_rgba(239,68,68,0.1)]',
  },
} as const

const RISK_LABELS: Record<string, string> = {
  low: 'Low risk',
  medium: 'Medium risk',
  high: 'High risk',
  critical: 'Critical risk',
}

export default function ValidateVerdict({
  verdict,
  legitimacyScore,
  riskLevel,
  headline,
  category,
}: ValidateVerdictProps) {
  const config = VERDICT_CONFIG[verdict]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`rounded-xl border p-5 ${config.bg} ${config.border} ${config.glow}`}
    >
      <div className="flex items-start gap-4">
        {/* Score circle */}
        <div className="relative flex-shrink-0">
          <svg width="72" height="72" viewBox="0 0 72 72">
            {/* Background ring */}
            <circle
              cx="36"
              cy="36"
              r="30"
              fill="none"
              stroke="#2a2a2a"
              strokeWidth="5"
            />
            {/* Score arc */}
            <motion.circle
              cx="36"
              cy="36"
              r="30"
              fill="none"
              stroke={config.barColor}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 30}`}
              strokeDashoffset={`${2 * Math.PI * 30 * (1 - legitimacyScore / 100)}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 30 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 30 * (1 - legitimacyScore / 100) }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              transform="rotate(-90 36 36)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className="text-lg font-bold text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {legitimacyScore}
            </motion.span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon size={16} className={config.iconColor} />
            <span className={`text-sm font-semibold ${config.iconColor}`}>
              {config.label}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1c1c1c] border border-[#2a2a2a] text-[#6b7280]">
              {category}
            </span>
          </div>
          <h3 className="text-white font-semibold text-base leading-snug mb-2">
            {headline}
          </h3>
          <p className="text-xs text-[#6b7280]">
            Legitimacy: {legitimacyScore}/100 · {RISK_LABELS[riskLevel]}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
