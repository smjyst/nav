import { createClient } from '@/lib/supabase/server'
import { getTopCoins } from '@/lib/api/coingecko'
import { getFearGreed, fearGreedColor } from '@/lib/api/alternative'
import Link from 'next/link'
import { ArrowRight, TrendingUp, Shield, Wallet, Sparkles } from 'lucide-react'
import PriceChange from '@/components/shared/PriceChange'
import { formatUsd } from '@/lib/utils/formatting'

export const metadata = { title: 'Dashboard — NAV' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  type ProfileRow = { display_name: string | null; guidance_mode: string; onboarding_completed: boolean }
  const [profileRaw, fearGreed, topCoins] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, guidance_mode, onboarding_completed')
      .eq('id', user!.id)
      .single()
      .then((r) => r.data as ProfileRow | null),
    getFearGreed().catch(() => null),
    getTopCoins(5).catch(() => []),
  ])
  const profile = profileRaw

  const firstName = profile?.display_name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          {greeting}, {firstName}
        </h1>
        <p className="text-sm text-[#6b7280] mt-0.5">
          Here&apos;s what&apos;s happening in the market
        </p>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Fear & Greed */}
        {fearGreed && (
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
            <p className="text-xs text-[#6b7280] mb-2">Fear &amp; Greed</p>
            <p
              className="text-3xl font-bold tabular-nums"
              style={{ color: fearGreedColor(fearGreed.value) }}
            >
              {fearGreed.value}
            </p>
            <p className="text-xs mt-0.5" style={{ color: fearGreedColor(fearGreed.value) }}>
              {fearGreed.value_classification}
            </p>
          </div>
        )}

        {/* BTC */}
        {topCoins[0] && (
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
            <p className="text-xs text-[#6b7280] mb-2">Bitcoin</p>
            <p className="text-xl font-bold text-white tabular-nums">
              {formatUsd(topCoins[0].current_price)}
            </p>
            <PriceChange pct={topCoins[0].price_change_percentage_24h} size="sm" showIcon />
          </div>
        )}

        {/* ETH */}
        {topCoins[1] && (
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
            <p className="text-xs text-[#6b7280] mb-2">Ethereum</p>
            <p className="text-xl font-bold text-white tabular-nums">
              {formatUsd(topCoins[1].current_price)}
            </p>
            <PriceChange pct={topCoins[1].price_change_percentage_24h} size="sm" showIcon />
          </div>
        )}

        {/* Portfolio placeholder */}
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
          <p className="text-xs text-[#6b7280] mb-2">My Portfolio</p>
          <Link href="/portfolio" className="text-sm text-[#818cf8] hover:text-[#a5b4fc] transition-colors">
            Set up portfolio →
          </Link>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/markets"
          className="group bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 hover:border-[#6366f1]/40 hover:bg-[#1c1c1c] transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-[#6366f1]/10 flex items-center justify-center mb-4">
            <TrendingUp size={18} className="text-[#6366f1]" />
          </div>
          <h3 className="text-white font-semibold mb-1">NAV Signal</h3>
          <p className="text-sm text-[#6b7280] mb-4">
            AI conviction scores for the top 50 coins. Bull, neutral, or bear — with the reasoning explained.
          </p>
          <span className="text-xs text-[#818cf8] group-hover:text-[#a5b4fc] flex items-center gap-1 transition-colors">
            View markets <ArrowRight size={12} />
          </span>
        </Link>

        <Link
          href="/validate"
          className="group bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 hover:border-[#10b981]/40 hover:bg-[#1c1c1c] transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-[#10b981]/10 flex items-center justify-center mb-4">
            <Shield size={18} className="text-[#10b981]" />
          </div>
          <h3 className="text-white font-semibold mb-1">NAV Validate</h3>
          <p className="text-sm text-[#6b7280] mb-4">
            Paste a token or contract address before you buy. NAV checks for scams, rug risks, and timing.
          </p>
          <span className="text-xs text-[#10b981] group-hover:text-[#34d399] flex items-center gap-1 transition-colors">
            Validate a token <ArrowRight size={12} />
          </span>
        </Link>

        <Link
          href="/wallet"
          className="group bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 hover:border-[#f59e0b]/40 hover:bg-[#1c1c1c] transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center mb-4">
            <Wallet size={18} className="text-[#f59e0b]" />
          </div>
          <h3 className="text-white font-semibold mb-1">Wallet Analyzer</h3>
          <p className="text-sm text-[#6b7280] mb-4">
            Analyse any Ethereum wallet. See what they hold, when they bought, and estimated ROI.
          </p>
          <span className="text-xs text-[#f59e0b] group-hover:text-[#fbbf24] flex items-center gap-1 transition-colors">
            Analyse a wallet <ArrowRight size={12} />
          </span>
        </Link>
      </div>

      {/* Top movers */}
      {topCoins.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white">Top Coins</h2>
            <Link href="/markets" className="text-xs text-[#6b7280] hover:text-[#9ca3af] transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-1.5">
            {topCoins.map((coin) => (
              <Link
                key={coin.id}
                href={`/markets/${coin.id}`}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#141414] border border-[#1f1f1f] hover:bg-[#1c1c1c] hover:border-[#2a2a2a] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#4b5563] w-4">{coin.market_cap_rank}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{coin.name}</p>
                    <p className="text-xs text-[#6b7280] uppercase">{coin.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white tabular-nums">{formatUsd(coin.current_price)}</p>
                  <PriceChange pct={coin.price_change_percentage_24h} size="sm" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Copilot CTA */}
      <div className="bg-gradient-to-r from-[#312e81]/30 to-[#1e1b4b]/30 border border-[#6366f1]/20 rounded-xl p-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
            <Sparkles size={16} className="text-[#818cf8]" />
            Ask NAV Copilot
          </h3>
          <p className="text-sm text-[#9ca3af]">
            &ldquo;What should I do today?&rdquo; · &ldquo;Why is ETH down?&rdquo; · &ldquo;Is now a good time to buy Bitcoin?&rdquo;
          </p>
        </div>
        <button
          onClick={() => {/* opens via store */}}
          className="flex-shrink-0 px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-medium rounded-lg transition-colors"
        >
          Ask
        </button>
      </div>
    </div>
  )
}
