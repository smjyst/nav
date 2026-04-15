'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, ShieldX, CheckCircle } from 'lucide-react'

interface RedFlag {
  label: string
  detail: string
  severity: 'warning' | 'danger'
}

interface GreenFlag {
  label: string
  detail: string
}

interface ValidateFlagsProps {
  redFlags: RedFlag[]
  greenFlags: GreenFlag[]
}

export default function ValidateFlags({ redFlags, greenFlags }: ValidateFlagsProps) {
  const hasRed = redFlags.length > 0
  const hasGreen = greenFlags.length > 0

  if (!hasRed && !hasGreen) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      {/* Red flags */}
      {hasRed && (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-[#ef4444]" />
            <span className="text-xs font-semibold text-[#ef4444]">
              Risk flags ({redFlags.length})
            </span>
          </div>
          <div className="space-y-2.5">
            {redFlags.map((flag, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="flex items-start gap-2"
              >
                {flag.severity === 'danger' ? (
                  <ShieldX size={12} className="text-[#ef4444] mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle size={12} className="text-[#f59e0b] mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className={`text-xs font-medium ${flag.severity === 'danger' ? 'text-[#ef4444]' : 'text-[#f59e0b]'}`}>
                    {flag.label}
                  </p>
                  <p className="text-[11px] text-[#6b7280] leading-relaxed">
                    {flag.detail}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Green flags */}
      {hasGreen && (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={14} className="text-[#10b981]" />
            <span className="text-xs font-semibold text-[#10b981]">
              Positive signals ({greenFlags.length})
            </span>
          </div>
          <div className="space-y-2.5">
            {greenFlags.map((flag, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="flex items-start gap-2"
              >
                <CheckCircle size={12} className="text-[#10b981] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-[#10b981]">{flag.label}</p>
                  <p className="text-[11px] text-[#6b7280] leading-relaxed">
                    {flag.detail}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
