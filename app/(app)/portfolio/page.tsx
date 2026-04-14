import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Briefcase } from 'lucide-react'

export const metadata = { title: 'Portfolio — NAV' }

export default async function PortfolioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  type HoldingRow = { id: string; coin_id: string; symbol: string; name: string; quantity: number; average_buy_price: number | null }
  type PortfolioRow = { id: string; name: string; is_default: boolean; holdings: HoldingRow[] }

  const { data: portfoliosRaw } = await supabase
    .from('portfolios')
    .select('*, holdings(*)')
    .eq('user_id', user!.id)

  const portfolios = portfoliosRaw as PortfolioRow[] | null
  const portfolio = portfolios?.[0]
  const holdings = portfolio?.holdings ?? []

  if (holdings.length === 0) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Portfolio</h1>
            <p className="text-sm text-[#6b7280]">Track your crypto holdings</p>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-center mb-4">
            <Briefcase size={28} className="text-[#4b5563]" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Your portfolio is empty</h2>
          <p className="text-sm text-[#6b7280] mb-6 max-w-xs">
            Add your crypto holdings to see your portfolio value, P&L, and personalised NAV insights.
          </p>
          <Link
            href="/portfolio/add"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus size={16} />
            Add your first holding
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Portfolio</h1>
          <p className="text-sm text-[#6b7280]">{holdings.length} holdings</p>
        </div>
        <Link
          href="/portfolio/add"
          className="flex items-center gap-2 px-4 py-2 bg-[#141414] hover:bg-[#1c1c1c] border border-[#2a2a2a] text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus size={14} />
          Add
        </Link>
      </div>

      {/* Holdings will be rendered here in Phase 1 */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-6 text-center">
        <p className="text-[#6b7280] text-sm">Portfolio dashboard coming in Phase 1</p>
      </div>
    </div>
  )
}
