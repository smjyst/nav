'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, RefreshCw } from 'lucide-react'
import HoldingsTable from '@/components/portfolio/HoldingsTable'
import type { HoldingWithPrice } from '@/components/portfolio/HoldingsTable'
import AllocationPie from '@/components/portfolio/AllocationPie'
import PortfolioSummary from '@/components/portfolio/PortfolioSummary'

interface HoldingRow {
  id: string
  coin_id: string
  symbol: string
  name: string
  quantity: number
  average_buy_price: number | null
}

export default function PortfolioClient({ initialHoldings }: { initialHoldings: HoldingRow[] }) {
  const [holdings, setHoldings] = useState<HoldingWithPrice[]>(
    initialHoldings.map((h) => ({ ...h }))
  )
  const [deleting, setDeleting] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchPrices = useCallback(async () => {
    if (holdings.length === 0) return
    const ids = holdings.map((h) => h.coin_id).join(',')
    try {
      const res = await fetch(`/api/market/prices?ids=${ids}`)
      if (!res.ok) return
      const prices: Record<string, { usd: number; usd_24h_change?: number }> = await res.json()

      setHoldings((prev) =>
        prev.map((h) => ({
          ...h,
          current_price: prices[h.coin_id]?.usd ?? h.current_price,
          price_change_24h: prices[h.coin_id]?.usd_24h_change ?? h.price_change_24h,
        }))
      )
    } catch {}
  }, [holdings.length]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 60_000)
    return () => clearInterval(interval)
  }, [fetchPrices])

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const res = await fetch('/api/portfolio/holdings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setHoldings((prev) => prev.filter((h) => h.id !== id))
      }
    } catch {} finally {
      setDeleting(null)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await fetchPrices()
    setRefreshing(false)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Portfolio</h1>
          <p className="text-sm text-[#6b7280]">{holdings.length} holding{holdings.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg border border-[#2a2a2a] text-[#6b7280] hover:text-white hover:bg-[#1c1c1c] transition-colors disabled:opacity-40"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <Link
            href="/portfolio/add"
            className="flex items-center gap-2 px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus size={14} />
            Add
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <PortfolioSummary holdings={holdings} />

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <HoldingsTable holdings={holdings} onDelete={handleDelete} deleting={deleting} />
        <AllocationPie holdings={holdings} />
      </div>
    </div>
  )
}
