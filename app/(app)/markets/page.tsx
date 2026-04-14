import { Suspense } from 'react'
import { getTopCoins } from '@/lib/api/coingecko'
import { getFearGreed, fearGreedColor } from '@/lib/api/alternative'
import MarketsClient from './MarketsClient'

export const metadata = { title: 'Markets — NAV' }

// Fetch fear & greed with fallback
async function safeGetFearGreed() {
  try { return await getFearGreed() } catch { return null }
}

async function safeGetTopCoins() {
  try { return await getTopCoins(50) } catch { return [] }
}

export default async function MarketsPage() {
  const [coins, fearGreed] = await Promise.all([
    safeGetTopCoins(),
    safeGetFearGreed(),
  ])

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Markets</h1>
          <p className="text-sm text-[#6b7280]">
            AI conviction scores updated every 4 hours
          </p>
        </div>

        {/* Fear & Greed */}
        {fearGreed && (
          <div className="flex-shrink-0 bg-[#141414] border border-[#2a2a2a] rounded-xl px-4 py-3 text-right">
            <p className="text-xs text-[#6b7280] mb-0.5">Fear & Greed</p>
            <p
              className="text-2xl font-bold tabular-nums"
              style={{ color: fearGreedColor(fearGreed.value) }}
            >
              {fearGreed.value}
            </p>
            <p className="text-xs" style={{ color: fearGreedColor(fearGreed.value) }}>
              {fearGreed.value_classification}
            </p>
          </div>
        )}
      </div>

      {/* Markets table */}
      <Suspense fallback={<MarketsTableSkeleton />}>
        <MarketsClient coins={coins} />
      </Suspense>
    </div>
  )
}

function MarketsTableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-16 bg-[#141414] rounded-xl animate-pulse border border-[#1f1f1f]" />
      ))}
    </div>
  )
}
