'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  TrendingUp,
  Activity,
  ShieldAlert,
  AlertTriangle,
  ShieldX,
  Plus,
  Search,
} from 'lucide-react'
import { ALERT_PRESETS } from '@/lib/agents/alerts'
import type { AlertType } from '@/lib/supabase/types'

const ICON_MAP: Record<string, typeof TrendingUp> = {
  TrendingUp,
  Activity,
  ShieldAlert,
  AlertTriangle,
  ShieldX,
}

interface CreateAlertModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export default function CreateAlertModal({
  open,
  onClose,
  onCreated,
}: CreateAlertModalProps) {
  const [step, setStep] = useState<'type' | 'config'>('type')
  const [selectedType, setSelectedType] = useState<AlertType | null>(null)
  const [coinId, setCoinId] = useState('')
  const [priceTarget, setPriceTarget] = useState('')
  const [priceDirection, setPriceDirection] = useState<'above' | 'below'>('above')
  const [changeThreshold, setChangeThreshold] = useState('15')
  const [drawdownThreshold, setDrawdownThreshold] = useState('10')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedPreset = ALERT_PRESETS.find((p) => p.alert_type === selectedType)

  function handleSelectType(type: AlertType) {
    setSelectedType(type)
    setStep('config')
    setError(null)
  }

  function reset() {
    setStep('type')
    setSelectedType(null)
    setCoinId('')
    setPriceTarget('')
    setPriceDirection('above')
    setChangeThreshold('15')
    setDrawdownThreshold('10')
    setError(null)
    setIsSubmitting(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit() {
    if (!selectedType) return
    setIsSubmitting(true)
    setError(null)

    let config: Record<string, string | number | boolean | null> = {}

    switch (selectedType) {
      case 'price_threshold':
        if (!coinId.trim() || !priceTarget.trim()) {
          setError('Please enter a coin and price target')
          setIsSubmitting(false)
          return
        }
        config = {
          direction: priceDirection,
          price: parseFloat(priceTarget),
        }
        break
      case 'conviction_change':
        if (!coinId.trim()) {
          setError('Please enter a coin')
          setIsSubmitting(false)
          return
        }
        config = { changeThreshold: parseInt(changeThreshold, 10) }
        break
      case 'portfolio_health':
        config = { drawdownThreshold: parseInt(drawdownThreshold, 10) }
        break
      default:
        config = {}
    }

    try {
      const res = await fetch('/api/alerts/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_type: selectedType,
          coin_id: selectedPreset?.requiresCoin ? coinId.trim().toLowerCase() : null,
          config,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error?.fieldErrors ? 'Please check your inputs' : 'Failed to create alert')
        setIsSubmitting(false)
        return
      }

      onCreated()
      handleClose()
    } catch {
      setError('Something went wrong')
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60"
        onClick={handleClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f1f1f]">
          <h2 className="text-base font-semibold text-white">
            {step === 'type' ? 'New Alert' : selectedPreset?.label ?? 'Configure'}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-md text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#1c1c1c] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <AnimatePresence mode="wait">
            {step === 'type' && (
              <motion.div
                key="type"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-2"
              >
                <p className="text-xs text-[#6b7280] mb-3">
                  What do you want to be alerted about?
                </p>
                {ALERT_PRESETS.map((preset) => {
                  const Icon = ICON_MAP[preset.icon] ?? AlertTriangle
                  return (
                    <button
                      key={preset.alert_type}
                      onClick={() => handleSelectType(preset.alert_type)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#0a0a0a]/60 border border-[#2a2a2a] hover:border-[#6366f1]/30 hover:bg-[#1c1c1c] transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#6366f1]/10 flex items-center justify-center flex-shrink-0">
                        <Icon
                          size={14}
                          className="text-[#6366f1] group-hover:text-[#818cf8] transition-colors"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {preset.label}
                        </p>
                        <p className="text-[11px] text-[#6b7280]">
                          {preset.description}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </motion.div>
            )}

            {step === 'config' && (
              <motion.div
                key="config"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <button
                  onClick={() => setStep('type')}
                  className="text-xs text-[#6366f1] hover:text-[#818cf8] transition-colors"
                >
                  ← Back
                </button>

                {/* Coin selector (for coin-specific alerts) */}
                {selectedPreset?.requiresCoin && (
                  <div>
                    <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">
                      Coin (CoinGecko ID)
                    </label>
                    <div className="relative">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4b5563]"
                      />
                      <input
                        value={coinId}
                        onChange={(e) => setCoinId(e.target.value)}
                        placeholder="e.g. bitcoin, ethereum, solana"
                        className="w-full bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg pl-9 pr-3 py-2.5 text-sm text-[#f9fafb] placeholder-[#4b5563] focus:outline-none focus:border-[#6366f1]/50 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Price threshold config */}
                {selectedType === 'price_threshold' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">
                        Direction
                      </label>
                      <div className="flex gap-2">
                        {(['above', 'below'] as const).map((dir) => (
                          <button
                            key={dir}
                            onClick={() => setPriceDirection(dir)}
                            className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                              priceDirection === dir
                                ? 'bg-[#6366f1]/10 border-[#6366f1]/40 text-[#818cf8]'
                                : 'bg-[#1c1c1c] border-[#2a2a2a] text-[#6b7280] hover:text-[#9ca3af]'
                            }`}
                          >
                            {dir === 'above' ? '📈 Goes above' : '📉 Falls below'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">
                        Price target (USD)
                      </label>
                      <input
                        type="number"
                        value={priceTarget}
                        onChange={(e) => setPriceTarget(e.target.value)}
                        placeholder="e.g. 100000"
                        className="w-full bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#f9fafb] placeholder-[#4b5563] focus:outline-none focus:border-[#6366f1]/50 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Conviction change config */}
                {selectedType === 'conviction_change' && (
                  <div>
                    <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">
                      Score change threshold (points)
                    </label>
                    <select
                      value={changeThreshold}
                      onChange={(e) => setChangeThreshold(e.target.value)}
                      className="w-full bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#f9fafb] focus:outline-none focus:border-[#6366f1]/50 transition-colors"
                    >
                      <option value="10">10+ points (more alerts)</option>
                      <option value="15">15+ points (recommended)</option>
                      <option value="25">25+ points (significant only)</option>
                    </select>
                  </div>
                )}

                {/* Portfolio health config */}
                {selectedType === 'portfolio_health' && (
                  <div>
                    <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">
                      Alert when portfolio drops by
                    </label>
                    <select
                      value={drawdownThreshold}
                      onChange={(e) => setDrawdownThreshold(e.target.value)}
                      className="w-full bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#f9fafb] focus:outline-none focus:border-[#6366f1]/50 transition-colors"
                    >
                      <option value="5">5% or more</option>
                      <option value="10">10% or more (recommended)</option>
                      <option value="15">15% or more</option>
                      <option value="25">25% or more (major only)</option>
                    </select>
                  </div>
                )}

                {/* Risk level / scam detection — no config needed */}
                {(selectedType === 'risk_level' || selectedType === 'scam_detection') && (
                  <p className="text-xs text-[#6b7280]">
                    {selectedType === 'risk_level'
                      ? 'NAV will alert you about extreme market conditions and significant drops in coins you hold.'
                      : 'NAV will monitor tokens in your watchlist and portfolio for suspicious on-chain activity.'}
                  </p>
                )}

                {error && (
                  <p className="text-xs text-[#ef4444]">{error}</p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40"
                >
                  <Plus size={14} />
                  {isSubmitting ? 'Creating...' : 'Create Alert'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
