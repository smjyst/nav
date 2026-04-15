'use client'

import { useState, useRef, useCallback } from 'react'
import { Shield, Search, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useUserStore } from '@/lib/stores/userStore'

export default function ValidateClient() {
  const [input, setInput] = useState('')
  const [completion, setCompletion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)
  const { guidanceMode } = useUserStore()
  const abortRef = useRef<AbortController | null>(null)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!input.trim() || isLoading) return

      // Abort any in-flight request
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setCompletion('')
      setIsLoading(true)
      setError(false)

      try {
        const res = await fetch('/api/ai/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: input.trim(), guidanceMode }),
          signal: controller.signal,
        })

        if (!res.ok || !res.body) {
          setError(true)
          setIsLoading(false)
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          setCompletion((prev) => prev + chunk)
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(true)
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
            {isContract ? '🔍 Detected contract address — will check on-chain data' : '🔍 Searching by name'}
          </p>
        )}
      </form>

      {/* What NAV checks */}
      {!completion && !isLoading && (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">What NAV Validate checks:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={16} className="text-[#10b981]" />
              </div>
              <div>
                <p className="text-sm font-medium text-white mb-0.5">Legitimacy</p>
                <p className="text-xs text-[#6b7280]">Contract verification, rug pull risks, liquidity locks</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={16} className="text-[#f59e0b]" />
              </div>
              <div>
                <p className="text-sm font-medium text-white mb-0.5">Risk flags</p>
                <p className="text-xs text-[#6b7280]">Holder concentration, volume anomalies, hype signals</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#6366f1]/10 flex items-center justify-center flex-shrink-0">
                <Clock size={16} className="text-[#6366f1]" />
              </div>
              <div>
                <p className="text-sm font-medium text-white mb-0.5">Entry timing</p>
                <p className="text-xs text-[#6b7280]">Is now early, mid, or late for this asset?</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && !completion && (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-4 h-4 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-[#9ca3af]">NAV is analysing...</span>
          </div>
          <p className="text-xs text-[#4b5563]">Checking contract data, legitimacy signals, and timing</p>
        </div>
      )}

      {/* Result */}
      {completion && (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-[#6366f1] flex items-center justify-center">
              <Shield size={12} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-white">NAV Validate result</span>
          </div>
          <div className="text-sm text-[#e5e7eb] leading-relaxed whitespace-pre-wrap">
            {completion}
            {isLoading && (
              <motion.span
                className="inline-block w-0.5 h-3.5 bg-[#6366f1] ml-0.5 align-middle"
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
              />
            )}
          </div>
          <p className="text-xs text-[#4b5563] mt-4 border-t border-[#1f1f1f] pt-3">
            This analysis is based on available data. Always do your own research. Not financial advice.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-[#7f1d1d]/20 border border-[#ef4444]/20 rounded-xl p-4 text-sm text-[#ef4444]">
          Something went wrong. Please try again.
        </div>
      )}
    </div>
  )
}
