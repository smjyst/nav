'use client'

import { useState, useRef, useCallback } from 'react'
import { Wallet, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { useUserStore } from '@/lib/stores/userStore'
import { truncateAddress } from '@/lib/utils/formatting'

export default function WalletClient() {
  const [address, setAddress] = useState('')
  const [completion, setCompletion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)
  const { guidanceMode } = useUserStore()
  const abortRef = useRef<AbortController | null>(null)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = address.trim()
      if (!trimmed || !/^0x[a-fA-F0-9]{40}$/.test(trimmed) || isLoading) return

      // Abort any in-flight request
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setCompletion('')
      setIsLoading(true)
      setError(false)

      try {
        const res = await fetch('/api/ai/wallet-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: trimmed, chain: 'ethereum', guidanceMode }),
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
    [address, guidanceMode, isLoading],
  )

  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(address.trim())

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
        <label className="block text-sm font-medium text-[#9ca3af] mb-3">
          Ethereum wallet address
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Wallet size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4b5563]" />
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
              className="w-full bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl pl-9 pr-3 py-3 text-sm text-[#f9fafb] placeholder-[#4b5563] focus:outline-none focus:border-[#6366f1]/50 transition-colors font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !isValidAddress}
            className="px-5 py-3 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Search size={14} />
            {isLoading ? 'Analysing...' : 'Analyse'}
          </button>
        </div>
        {address.trim() && !isValidAddress && (
          <p className="mt-2 text-xs text-[#ef4444]">
            Please enter a valid Ethereum address (starts with 0x, 42 characters)
          </p>
        )}
        <p className="mt-3 text-xs text-[#4b5563]">
          This uses publicly available on-chain data only. We do not store wallet addresses.
        </p>
      </form>

      {isLoading && !completion && (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-4 h-4 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-[#9ca3af]">Fetching on-chain data...</span>
          </div>
          {address && (
            <p className="text-xs text-[#4b5563] font-mono">{truncateAddress(address)}</p>
          )}
        </div>
      )}

      {completion && (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-[#f59e0b]/10 flex items-center justify-center">
              <Wallet size={12} className="text-[#f59e0b]" />
            </div>
            <span className="text-sm font-semibold text-white">Wallet analysis</span>
            {address && (
              <span className="text-xs text-[#4b5563] font-mono ml-auto">
                {truncateAddress(address)}
              </span>
            )}
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
            Analysis based on public blockchain data. Not financial advice.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-[#7f1d1d]/20 border border-[#ef4444]/20 rounded-xl p-4 text-sm text-[#ef4444]">
          Failed to analyse wallet. Please check the address and try again.
        </div>
      )}
    </div>
  )
}
