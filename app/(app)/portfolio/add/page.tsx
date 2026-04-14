'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowLeft, Loader2, Plus, Check } from 'lucide-react'
import Image from 'next/image'

interface SearchResult {
  id: string
  name: string
  symbol: string
  thumb: string
}

export default function AddHoldingPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [quantity, setQuantity] = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.coins ?? [])
        }
      } catch {} finally {
        setSearching(false)
      }
    }, 300)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !quantity) return

    const qty = parseFloat(quantity)
    const price = buyPrice ? parseFloat(buyPrice) : null
    if (isNaN(qty) || qty <= 0) { setError('Quantity must be greater than zero'); return }
    if (price !== null && (isNaN(price) || price <= 0)) { setError('Buy price must be greater than zero'); return }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/portfolio/holdings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coin_id: selected.id,
          symbol: selected.symbol,
          name: selected.name,
          quantity: qty,
          average_buy_price: price,
        }),
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/portfolio'), 800)
      } else {
        setError('Failed to add holding. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#9ca3af] mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <h1 className="text-xl font-bold text-white mb-1">Add Holding</h1>
      <p className="text-sm text-[#6b7280] mb-6">
        Search for a coin and enter how much you hold.
      </p>

      {/* Coin search */}
      {!selected ? (
        <div>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4b5563]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a coin..."
              autoFocus
              className="w-full bg-[#141414] border border-[#2a2a2a] rounded-xl pl-9 pr-3 py-3 text-sm text-[#f9fafb] placeholder-[#4b5563] focus:outline-none focus:border-[#6366f1]/50 transition-colors"
            />
            {searching && (
              <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6366f1] animate-spin" />
            )}
          </div>

          {results.length > 0 && (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden">
              {results.map((coin) => (
                <button
                  key={coin.id}
                  onClick={() => { setSelected(coin); setQuery(''); setResults([]) }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1c1c1c] transition-colors text-left border-b border-[#1f1f1f] last:border-b-0"
                >
                  {coin.thumb && (
                    <Image src={coin.thumb} alt={coin.name} width={24} height={24} className="rounded-full" unoptimized />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium truncate">{coin.name}</p>
                    <p className="text-xs text-[#6b7280] uppercase">{coin.symbol}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {query.length >= 2 && !searching && results.length === 0 && (
            <p className="text-sm text-[#6b7280] text-center py-4">No coins found</p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selected coin */}
          <div className="flex items-center gap-3 bg-[#141414] border border-[#2a2a2a] rounded-xl px-4 py-3">
            {selected.thumb && (
              <Image src={selected.thumb} alt={selected.name} width={28} height={28} className="rounded-full" unoptimized />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium">{selected.name}</p>
              <p className="text-xs text-[#6b7280] uppercase">{selected.symbol}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-xs text-[#6b7280] hover:text-[#9ca3af] transition-colors"
            >
              Change
            </button>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm text-[#9ca3af] mb-1.5">
              Quantity <span className="text-[#ef4444]">*</span>
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00"
              required
              className="w-full bg-[#141414] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-[#f9fafb] placeholder-[#4b5563] focus:outline-none focus:border-[#6366f1]/50 transition-colors tabular-nums"
            />
          </div>

          {/* Average buy price */}
          <div>
            <label className="block text-sm text-[#9ca3af] mb-1.5">
              Average buy price (USD) <span className="text-[#4b5563]">optional</span>
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#141414] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-[#f9fafb] placeholder-[#4b5563] focus:outline-none focus:border-[#6366f1]/50 transition-colors tabular-nums"
            />
            <p className="text-xs text-[#4b5563] mt-1">Used to calculate your profit & loss</p>
          </div>

          {error && (
            <p className="text-sm text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl px-4 py-2.5">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!quantity || saving || success}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {success ? (
              <><Check size={16} /> Added</>
            ) : saving ? (
              <><Loader2 size={16} className="animate-spin" /> Adding...</>
            ) : (
              <><Plus size={16} /> Add to portfolio</>
            )}
          </button>
        </form>
      )}
    </div>
  )
}
