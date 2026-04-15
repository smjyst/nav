'use client'

import { useState, useCallback } from 'react'
import { Shield, Search, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/lib/stores/userStore'
import ValidateVerdict from '@/components/validate/ValidateVerdict'
import ValidateFlags from '@/components/validate/ValidateFlags'
import ValidateTiming from '@/components/validate/ValidateTiming'
import ValidateSecurity from '@/components/validate/ValidateSecurity'
import type { ValidateOutput, ValidateContext } from '@/lib/agents/validate'

interface ValidateResult {
  validation: ValidateOutput
  context: ValidateContext
}

export default function ValidateClient() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<ValidateResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { guidanceMode } = useUserStore()

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!input.trim() || isLoading) return

      setResult(null)
      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/ai/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: input.trim(), guidanceMode }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error || 'Failed to analyse. Please try again.')
          return
        }

        const data: ValidateResult = await res.json()
        setResult(data)
      } catch {
        setError('Something went wrong. Please try again.')
      } finally {
        setIsLoading(false)
      }
    },
    [input, guidanceMode, isLoading],
  )

  const isContract = /^0x[a-fA-F0-9]{40}$/.test(input.trim())

  return (
    <div className="space-y-4">
      {/* Input form */}
      <form onSubmit={handleSubmit} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
        <label className="block text-sm font-medium text-[#9ca3af] mb-3">
          Token name or contract address
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4b5563]" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Bitcoin, PEPE, 0x1234..."
              className="w-full bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl pl-9 pr-3 py-3 text-sm text-[#f9fafb] placeholder-[#4b5563] focus:outline-none focus:border-[#6366f1]/50 transition-colors font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-5 py-3 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Shield size={14} />
            {isLoading ? 'Checking...' : 'Validate'}
          </button>
        </div>
        {input.trim() && (
          <p className="mt-2 text-xs text-[#6b7280]">
            {isContract
              ? '🔍 Detected contract address — will check on-chain data'
              : '🔍 Searching by name'}
          </p>
        )}
      </form>

      {/* What NAV checks — shown only when no result */}
      <AnimatePresence>
        {!result && !isLoading && !error && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-4">
              What NAV Validate checks:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={16} className="text-[#10b981]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white mb-0.5">Legitimacy</p>
                  <p className="text-xs text-[#6b7280]">
                    Contract verification, project presence, exchange listings
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={16} className="text-[#f59e0b]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white mb-0.5">Risk flags</p>
                  <p className="text-xs text-[#6b7280]">
                    Holder concentration, volume anomalies, supply risks
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#6366f1]/10 flex items-center justify-center flex-shrink-0">
                  <Clock size={16} className="text-[#6366f1]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white mb-0.5">Entry timing</p>
                  <p className="text-xs text-[#6b7280]">
                    Is now early, mid, or late for this asset?
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-8"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 border-2 border-[#6366f1]/30 rounded-full" />
                <div className="absolute inset-0 w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white mb-1">
                  Validating{' '}
                  {isContract ? (
                    <span className="font-mono text-[#6366f1]">
                      {input.trim().slice(0, 6)}...{input.trim().slice(-4)}
                    </span>
                  ) : (
                    <span className="text-[#6366f1]">{input.trim()}</span>
                  )}
                </p>
                <p className="text-xs text-[#6b7280]">
                  Checking contract data, market signals, and risk factors
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {/* Resolved identity header */}
            {result.context.resolvedName && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 px-1"
              >
                {result.context.thumb && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={result.context.thumb}
                    alt={result.context.resolvedName}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                )}
                <div>
                  <p className="text-sm font-semibold text-white">
                    {result.context.resolvedName}
                    {result.context.resolvedSymbol && (
                      <span className="text-[#6b7280] font-normal ml-1.5">
                        {result.context.resolvedSymbol.toUpperCase()}
                      </span>
                    )}
                  </p>
                  {result.context.price !== undefined && (
                    <p className="text-xs text-[#6b7280]">
                      ${result.context.price.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      {result.context.rank && (
                        <span className="ml-2">Rank #{result.context.rank}</span>
                      )}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Verdict card */}
            <ValidateVerdict
              verdict={result.validation.verdict}
              legitimacyScore={result.validation.legitimacy_score}
              riskLevel={result.validation.risk_level}
              headline={result.validation.headline}
              category={result.validation.category}
            />

            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4"
            >
              <p className="text-sm text-[#d1d5db] leading-relaxed">
                {result.validation.summary}
              </p>
            </motion.div>

            {/* Red & green flags */}
            <ValidateFlags
              redFlags={result.validation.red_flags}
              greenFlags={result.validation.green_flags}
            />

            {/* Contract security (GoPlusLabs) */}
            {result.context.security && (
              <ValidateSecurity security={result.context.security} />
            )}

            {/* Timing & recommendation */}
            <ValidateTiming
              assessment={result.validation.timing.assessment}
              detail={result.validation.timing.detail}
              recommendation={result.validation.recommendation}
            />

            {/* Market data snapshot */}
            {result.context.marketCap && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4"
              >
                <p className="text-xs text-[#6b7280] font-medium mb-3">Market snapshot</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <DataPoint
                    label="Market cap"
                    value={`$${formatCompact(result.context.marketCap)}`}
                  />
                  {result.context.volume24h && (
                    <DataPoint
                      label="24h volume"
                      value={`$${formatCompact(result.context.volume24h)}`}
                    />
                  )}
                  {result.context.change24h !== undefined && (
                    <DataPoint
                      label="24h change"
                      value={`${result.context.change24h >= 0 ? '+' : ''}${result.context.change24h.toFixed(1)}%`}
                      color={
                        result.context.change24h > 0
                          ? 'text-[#10b981]'
                          : result.context.change24h < 0
                            ? 'text-[#ef4444]'
                            : 'text-[#9ca3af]'
                      }
                    />
                  )}
                  {result.context.holderCount ? (
                    <DataPoint
                      label="Holders"
                      value={result.context.holderCount.toLocaleString()}
                    />
                  ) : result.context.change30d !== undefined ? (
                    <DataPoint
                      label="30d change"
                      value={`${result.context.change30d >= 0 ? '+' : ''}${result.context.change30d.toFixed(1)}%`}
                      color={
                        result.context.change30d > 0
                          ? 'text-[#10b981]'
                          : result.context.change30d < 0
                            ? 'text-[#ef4444]'
                            : 'text-[#9ca3af]'
                      }
                    />
                  ) : null}
                </div>
              </motion.div>
            )}

            {/* Disclaimer */}
            <p className="text-[9px] text-[#4b5563] text-center pt-1">
              NAV Validate is analysis, not financial advice. Always do your own research.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-[#7f1d1d]/20 border border-[#ef4444]/20 rounded-xl p-4"
          >
            <p className="text-sm text-[#ef4444] mb-2">{error}</p>
            <button
              onClick={() => {
                setError(null)
                setResult(null)
              }}
              className="text-xs text-[#ef4444] underline hover:text-[#f87171] transition-colors"
            >
              Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Helpers ──

function DataPoint({
  label,
  value,
  color = 'text-[#e5e7eb]',
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <div>
      <p className="text-[10px] text-[#4b5563] mb-0.5">{label}</p>
      <p className={`text-sm font-medium ${color}`}>{value}</p>
    </div>
  )
}

function formatCompact(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
  return n.toFixed(2)
}
