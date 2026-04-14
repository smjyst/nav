import { getCoinDetail } from '@/lib/api/coingecko'
import { notFound } from 'next/navigation'
import TokenClient from './TokenClient'
import { formatUsd, formatChange, formatLargeNumber } from '@/lib/utils/formatting'
import PriceChange from '@/components/shared/PriceChange'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'

interface TokenPageProps {
  params: Promise<{ coinId: string }>
}

export async function generateMetadata({ params }: TokenPageProps): Promise<Metadata> {
  const { coinId } = await params
  try {
    const coin = await getCoinDetail(coinId)
    return { title: `${coin.name} (${coin.symbol.toUpperCase()}) — NAV` }
  } catch {
    return { title: 'Token — NAV' }
  }
}

export default async function TokenPage({ params }: TokenPageProps) {
  const { coinId } = await params

  let coin
  try {
    coin = await getCoinDetail(coinId)
  } catch {
    notFound()
  }

  const md = coin.market_data

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Back */}
      <Link
        href="/markets"
        className="inline-flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#9ca3af] mb-6 transition-colors"
      >
        <ChevronLeft size={14} />
        Back to markets
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        {coin.image?.large && (
          <Image
            src={coin.image.large}
            alt={coin.name}
            width={56}
            height={56}
            className="rounded-full flex-shrink-0"
            unoptimized
          />
        )}
        <div className="flex-1">
          <div className="flex items-baseline gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">{coin.name}</h1>
            <span className="text-[#6b7280] font-medium uppercase">{coin.symbol}</span>
            <span className="text-xs text-[#4b5563]">#{coin.market_cap_rank}</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-white tabular-nums">
              {formatUsd(md.current_price.usd)}
            </span>
            <PriceChange pct={md.price_change_percentage_24h} size="md" showIcon />
          </div>
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Market Cap" value={`$${formatLargeNumber(md.market_cap.usd)}`} />
        <StatCard label="24h Volume" value={`$${formatLargeNumber(md.total_volume.usd)}`} />
        <StatCard label="7d Change" value={formatChange(md.price_change_percentage_7d)} color={md.price_change_percentage_7d > 0 ? '#10b981' : '#ef4444'} />
        <StatCard label="From ATH" value={formatChange(md.ath_change_percentage.usd)} color={md.ath_change_percentage.usd > -20 ? '#10b981' : md.ath_change_percentage.usd > -50 ? '#f59e0b' : '#ef4444'} />
      </div>

      {/* AI Conviction + chart (client component) */}
      <TokenClient coin={coin} />

      {/* Description */}
      {coin.description.en && (
        <div className="mt-6 bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3">About {coin.name}</h2>
          <p className="text-sm text-[#9ca3af] leading-relaxed line-clamp-4">
            {coin.description.en.replace(/<[^>]+>/g, '')}
          </p>
        </div>
      )}

      {/* Links */}
      {coin.links?.homepage?.[0] && (
        <div className="mt-4 flex gap-2">
          <a
            href={coin.links.homepage[0]}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#6b7280] hover:text-[#9ca3af] transition-colors"
          >
            <ExternalLink size={12} />
            Website
          </a>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
      <p className="text-xs text-[#6b7280] mb-1">{label}</p>
      <p className="text-base font-semibold tabular-nums" style={{ color: color ?? '#f9fafb' }}>
        {value}
      </p>
    </div>
  )
}
