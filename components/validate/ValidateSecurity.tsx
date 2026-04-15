'use client'

import { motion } from 'framer-motion'
import { Lock, Unlock, ShieldCheck, ShieldX, AlertTriangle } from 'lucide-react'
import type { SecuritySummary } from '@/lib/api/goplus'

interface ValidateSecurityProps {
  security: SecuritySummary
}

export default function ValidateSecurity({ security }: ValidateSecurityProps) {
  const checks = [
    {
      label: 'Honeypot',
      pass: !security.isHoneypot,
      detail: security.isHoneypot ? 'Cannot sell tokens' : 'Tokens can be sold',
      critical: security.isHoneypot,
    },
    {
      label: 'Open source',
      pass: security.isOpenSource,
      detail: security.isOpenSource ? 'Contract code is verified' : 'Contract code is hidden',
      critical: false,
    },
    {
      label: 'Mintable',
      pass: !security.isMintable,
      detail: security.isMintable ? 'New tokens can be created' : 'Supply is fixed',
      critical: false,
    },
    {
      label: 'Proxy contract',
      pass: !security.isProxy,
      detail: security.isProxy ? 'Code can be changed' : 'Code is immutable',
      critical: false,
    },
    {
      label: 'Pausable',
      pass: !security.canPause,
      detail: security.canPause ? 'Owner can freeze transfers' : 'Transfers always open',
      critical: false,
    },
    {
      label: 'Liquidity',
      pass: security.hasLockedLiquidity,
      detail: security.hasLockedLiquidity ? 'Liquidity is locked' : 'Liquidity is NOT locked',
      critical: !security.hasLockedLiquidity && security.liquidityUsd > 0,
    },
  ]

  const passCount = checks.filter((c) => c.pass).length
  const totalChecks = checks.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-[#6366f1]" />
          <span className="text-xs font-semibold text-[#9ca3af]">
            Contract Security
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1c1c1c] border border-[#2a2a2a] text-[#6b7280]">
          {passCount}/{totalChecks} passed
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {checks.map((check, i) => (
          <motion.div
            key={check.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 + i * 0.05 }}
            className={`flex items-start gap-2 p-2 rounded-lg ${
              check.critical
                ? 'bg-[#7f1d1d]/20 border border-[#ef4444]/20'
                : check.pass
                  ? 'bg-[#0a0a0a]/60'
                  : 'bg-[#78350f]/10 border border-[#f59e0b]/10'
            }`}
          >
            {check.critical ? (
              <ShieldX size={12} className="text-[#ef4444] mt-0.5 flex-shrink-0" />
            ) : check.pass ? (
              <Lock size={12} className="text-[#10b981] mt-0.5 flex-shrink-0" />
            ) : (
              <Unlock size={12} className="text-[#f59e0b] mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p className="text-[11px] font-medium text-[#e5e7eb]">{check.label}</p>
              <p className="text-[10px] text-[#6b7280] leading-snug">{check.detail}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tax info if non-zero */}
      {(security.buyTaxPercent > 0 || security.sellTaxPercent > 0) && (
        <div className="mt-3 flex items-center gap-3 pt-3 border-t border-[#1f1f1f]">
          <AlertTriangle size={12} className="text-[#f59e0b] flex-shrink-0" />
          <p className="text-[11px] text-[#9ca3af]">
            {security.buyTaxPercent > 0 && `Buy tax: ${security.buyTaxPercent.toFixed(1)}%`}
            {security.buyTaxPercent > 0 && security.sellTaxPercent > 0 && ' · '}
            {security.sellTaxPercent > 0 && `Sell tax: ${security.sellTaxPercent.toFixed(1)}%`}
          </p>
        </div>
      )}

      {/* Holder concentration if significant */}
      {security.topHolderPercent > 5 && (
        <div className="mt-2 flex items-center gap-3 pt-2 border-t border-[#1f1f1f]">
          <AlertTriangle
            size={12}
            className={security.topHolderPercent > 20 ? 'text-[#ef4444] flex-shrink-0' : 'text-[#f59e0b] flex-shrink-0'}
          />
          <p className="text-[11px] text-[#9ca3af]">
            Top wallet holds {security.topHolderPercent.toFixed(1)}% of supply
          </p>
        </div>
      )}

      <p className="text-[9px] text-[#4b5563] mt-3">
        Powered by GoPlusLabs security analysis
      </p>
    </motion.div>
  )
}
