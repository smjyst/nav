import { createClient } from '@/lib/supabase/server'
import { getTopCoins } from '@/lib/api/coingecko'
import { getFearGreed, fearGreedColor } from '@/lib/api/alternative'
import Link from 'next/link'
import { ArrowRight, TrendingUp, TrendingDown, Shield, Wallet, Activity, Bitcoin, CircleDollarSign, Briefcase, Flame } from 'lucide-react'
import PriceChange from '@/components/shared/PriceChange'
import { formatUsd } from '@/lib/utils/formatting'
import NewsTicker from './NewsTicker'
import CopilotLauncher from './CopilotLauncher'

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
    getTopCoins(50).catch(() => []),
  ])
  const profile = profileRaw

  // Sort by absolute 24h change to find biggest movers
  const biggestMovers = [...topCoins]
    .filter((c) => c.price_change_percentage_24h != null)
    .sort((a, b) => Math.abs(b.price_change_percentage_24h) - Math.abs(a.price_change_percentage_24h))
    .slice(0, 6)

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

      {/* Trending News */}
      <NewsTicker />

      {/* Quick stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Sentiment */}
        {fearGreed && (
          <div className="bg-[#141414]/80 backdrop-blur-sm border border-[#1f1f1f] rounded-2xl p-4 flex items-center gap-3.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${fearGreedColor(fearGreed.value)}15` }}
            >
              <Activity size={20} style={{ color: fearGreedColor(fearGreed.value) }} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-[#6b7280] font-medium">Sentiment</p>
              <div className="flex items-baseline gap-1.5">
                <span
                  className="text-lg font-bold tabular-nums leading-tight"
                  style={{ color: fearGreedColor(fearGreed.value) }}
                >
                  {fearGreed.value}
                </span>
                <span className="text-[11px] text-[#6b7280]">/100</span>
              </div>
              <p
                className="text-[11px] font-medium leading-tight"
                style={{ color: fearGreedColor(fearGreed.value) }}
              >
                {fearGreed.value_classification}
              </p>
            </div>
          </div>
        )}

        {/* BTC */}
        {topCoins[0] && (
          <div className="bg-[#141414]/80 backdrop-blur-sm border border-[#1f1f1f] rounded-2xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#f7931a]/10 flex items-center justify-center shrink-0">
              <Bitcoin size={20} className="text-[#f7931a]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-[#6b7280] font-medium">Bitcoin</p>
              <p className="text-lg font-bold text-white tabular-nums leading-tight">
                {formatUsd(topCoins[0].current_price)}
              </p>
              <PriceChange pct={topCoins[0].price_change_percentage_24h} size="sm" />
            </div>
          </div>
        )}

        {/* ETH */}
        {topCoins[1] && (
          <div className="bg-[#141414]/80 backdrop-blur-sm border border-[#1f1f1f] rounded-2xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#627eea]/10 flex items-center justify-center shrink-0">
              <CircleDollarSign size={20} className="text-[#627eea]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-[#6b7280] font-medium">Ethereum</p>
              <p className="text-lg font-bold text-white tabular-nums leading-tight">
                {formatUsd(topCoins[1].current_price)}
              </p>
              <PriceChange pct={topCoins[1].price_change_percentage_24h} size="sm" />
            </div>
          </div>
        )}

        {/* Portfolio */}
        <div className="bg-[#141414]/80 backdrop-blur-sm border border-[#1f1f1f] rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#6366f1]/10 flex items-center justify-center shrink-0">
            <Briefcase size={20} className="text-[#6366f1]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-[#6b7280] font-medium">Portfolio</p>
            <Link href="/portfolio" className="text-sm font-semibold text-[#818cf8] hover:text-[#a5b4fc] transition-colors leading-tight block">
              Set up →
            </Link>
            <p className="text-[11px] text-[#4b5563] leading-tight">Track your holdings</p>
          </div>
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

      {/* Biggest Movers */}
      {biggestMovers.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-[#f59e0b]" />
              <h2 className="text-base font-semibold text-white">Biggest Movers</h2>
              <span className="text-[10px] text-[#6b7280] bg-[#1c1c1c] px-1.5 py-0.5 rounded-md">24h</span>
            </div>
            <Link href="/markets" className="text-xs text-[#6b7280] hover:text-[#9ca3af] transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-1.5">
            {biggestMovers.map((coin) => {
              const isUp = coin.price_change_percentage_24h >= 0
              return (
                <Link
                  key={coin.id}
                  href={`/markets/${coin.id}`}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#141414] border border-[#1f1f1f] hover:bg-[#1c1c1c] hover:border-[#2a2a2a] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isUp ? 'bg-[#10b981]/10' : 'bg-[#ef4444]/10'}`}>
                      {isUp
                        ? <TrendingUp size={14} className="text-[#10b981]" />
                        : <TrendingDown size={14} className="text-[#ef4444]" />
                      }
                    </div>
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
              )
            })}
          </div>
        </div>
      )}

      {/* Copilot Launcher */}
      <CopilotLauncher />
    </div>
  )
}
