'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Star } from 'lucide-react'
import ConvictionBadge from '@/components/conviction/ConvictionBadge'
import PriceChange from '@/components/shared/PriceChange'
import { formatUsd, formatLargeNumber } from '@/lib/utils/formatting'
import type { CoinPrice } from '@/lib/api/coingecko'

interface MarketsClientProps {
  coins: CoinPrice[]
}

export default function MarketsClient({ coins }: MarketsClientProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'top10' | 'top50'>('all')

  const filtered = coins
    .filter((c) => {
      const q = search.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
    })
    .filter((c) => {
      if (filter === 'top10') return c.market_cap_rank <= 10
      if (filter === 'top50') return c.market_cap_rank <= 50
      return true
    })

  return (
    <div>
      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4b5563]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search coins..."
            className="w-full bg-[#141414] border border-[#2a2a2a] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[#f9fafb] placeholder-[#4b5563] focus:outline-none focus:border-[#6366f1]/50 transition-colors"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'top10', 'top50'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: filter === f ? '#6366f1' : '#141414',
                color: filter === f ? '#ffffff' : '#6b7280',
                border: `1px solid ${filter === f ? '#6366f1' : '#2a2a2a'}`,
              }}
            >
              {f === 'all' ? 'All' : f === 'top10' ? 'Top 10' : 'Top 50'}
            </button>
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 px-4 mb-2 text-xs text-[#4b5563] hidden md:grid">
        <span>Asset</span>
        <span className="text-right">Price</span>
        <span className="text-right">24h</span>
        <span className="text-right">Market Cap</span>
        <span className="text-center">NAV Signal</span>
      </div>

      {/* Coin rows */}
      <div className="space-y-1.5">
        {filtered.map((coin) => (
          <CoinRow key={coin.id} coin={coin} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[#6b7280] text-sm">
          No coins found for &quot;{search}&quot;
        </div>
      )}
    </div>
  )
}

function CoinRow({ coin }: { coin: CoinPrice }) {
  // Derive a quick heuristic conviction for display
  // Real conviction is AI-computed and fetched on the token detail page
  const change7d = coin.price_change_percentage_7d_in_currency ?? 0
  const change30d = coin.price_change_percentage_30d_in_currency ?? 0
  const quickOutlook = change7d > 5 && change30d > 0 ? 'bull' :
                        change7d < -5 && change30d < 0 ? 'bear' : 'neutral'

  return (
    <Link
      href={`/markets/${coin.id}`}
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#141414] border border-[#1f1f1f] hover:border-[#2a2a2a] hover:bg-[#1c1c1c] transition-colors group"
    >
      {/* Rank + Logo + Name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-xs text-[#4b5563] w-6 text-right flex-shrink-0">
          {coin.market_cap_rank}
        </span>
        {coin.image && (
          <Image
            src={coin.image}
            alt={coin.name}
            width={32}
            height={32}
            className="rounded-full flex-shrink-0"
            unoptimized
          />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate group-hover:text-[#818cf8] transition-colors">
            {coin.name}
          </p>
          <p className="text-xs text-[#6b7280] uppercase">{coin.symbol}</p>
        </div>
      </div>

      {/* Price */}
      <div className="text-sm font-medium text-[#f9fafb] tabular-nums text-right w-24 flex-shrink-0 hidden sm:block">
        {formatUsd(coin.current_price)}
      </div>

      {/* 24h change */}
      <div className="text-right w-16 flex-shrink-0 hidden md:block">
        <PriceChange pct={coin.price_change_percentage_24h} />
      </div>

      {/* Market cap */}
      <div className="text-sm text-[#9ca3af] tabular-nums text-right w-20 flex-shrink-0 hidden md:block">
        ${formatLargeNumber(coin.market_cap)}
      </div>

      {/* NAV Signal badge */}
      <div className="flex items-center justify-end w-20 flex-shrink-0">
        <ConvictionBadge outlook={quickOutlook} />
      </div>
    </Link>
  )
}
