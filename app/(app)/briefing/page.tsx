import { createClient } from '@/lib/supabase/server'
import { Newspaper, RefreshCw } from 'lucide-react'
import GenerateBriefingButton from './GenerateBriefingButton'

export const metadata = { title: 'Daily Briefing — NAV' }

export default async function BriefingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = new Date().toISOString().split('T')[0]
  const { data: briefingRaw } = await supabase
    .from('daily_briefings')
    .select('*')
    .eq('user_id', user!.id)
    .eq('briefing_date', today)
    .single()

  const briefing = briefingRaw as { id: string; content: Record<string, unknown>; generated_at: string } | null

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">NAV Pulse</h1>
          <p className="text-sm text-[#6b7280]">Your daily market briefing</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#6b7280]">
          <Newspaper size={14} />
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {briefing ? (
        <BriefingContent content={briefing.content as Record<string, unknown>} />
      ) : (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-center mx-auto mb-4">
            <RefreshCw size={20} className="text-[#4b5563]" />
          </div>
          <h2 className="text-base font-semibold text-white mb-2">Briefing not yet generated</h2>
          <p className="text-sm text-[#6b7280] max-w-xs mx-auto">
            Your personalised briefing is generated each morning. Check back tomorrow, or trigger one manually below.
          </p>
          <GenerateBriefingButton />
        </div>
      )}
    </div>
  )
}

function BriefingContent({ content }: { content: Record<string, unknown> }) {
  const marketMood = content.market_mood as string
  const portfolioNote = content.portfolio_note as string
  const topMovers = content.top_movers as Array<{ name: string; symbol: string; change: string; why: string }> | undefined
  const actionItems = content.action_items as string[]
  const learningBite = content.learning_bite as string
  const riskLevel = content.risk_level as string | undefined
  const emoji = content.summary_emoji as string | undefined

  return (
    <div className="space-y-4">
      {marketMood && (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs text-[#6b7280] font-medium uppercase tracking-wide">Market mood</p>
            {emoji && <span className="text-sm">{emoji}</span>}
            {riskLevel && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${riskLevel === 'high' ? 'bg-[#ef4444]/10 text-[#ef4444]' : riskLevel === 'medium' ? 'bg-[#f59e0b]/10 text-[#f59e0b]' : 'bg-[#10b981]/10 text-[#10b981]'}`}>
                {riskLevel} risk
              </span>
            )}
          </div>
          <p className="text-sm text-[#e5e7eb] leading-relaxed">{marketMood}</p>
        </div>
      )}
      {portfolioNote && (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <p className="text-xs text-[#6b7280] font-medium uppercase tracking-wide mb-2">Your portfolio</p>
          <p className="text-sm text-[#e5e7eb] leading-relaxed">{portfolioNote}</p>
        </div>
      )}
      {topMovers && topMovers.length > 0 && (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <p className="text-xs text-[#6b7280] font-medium uppercase tracking-wide mb-3">Top movers</p>
          <div className="space-y-2">
            {topMovers.map((m, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-white font-medium">{m.symbol}</span>
                  <span className="text-xs text-[#6b7280] ml-2">{m.name}</span>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-medium tabular-nums ${m.change.startsWith('-') ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
                    {m.change}
                  </span>
                  {m.why && <p className="text-xs text-[#6b7280]">{m.why}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {actionItems?.length > 0 && (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <p className="text-xs text-[#6b7280] font-medium uppercase tracking-wide mb-3">Suggested actions</p>
          <ul className="space-y-2">
            {actionItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#e5e7eb]">
                <span className="text-[#6366f1] mt-0.5 flex-shrink-0">&rarr;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {learningBite && (
        <div className="bg-[#6366f1]/5 border border-[#6366f1]/20 rounded-xl p-5">
          <p className="text-xs text-[#818cf8] font-medium uppercase tracking-wide mb-2">Today&apos;s learning bite</p>
          <p className="text-sm text-[#e5e7eb] leading-relaxed">{learningBite}</p>
        </div>
      )}
    </div>
  )
}
