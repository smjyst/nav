import { createClient } from '@/lib/supabase/server'
import { Newspaper, RefreshCw } from 'lucide-react'

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
        </div>
      )}
    </div>
  )
}

function BriefingContent({ content }: { content: Record<string, unknown> }) {
  const marketMood = content.market_mood as string
  const portfolioNote = content.portfolio_note as string
  const actionItems = content.action_items as string[]
  const learningBite = content.learning_bite as string

  return (
    <div className="space-y-4">
      {marketMood && (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <p className="text-xs text-[#6b7280] font-medium uppercase tracking-wide mb-2">Market mood</p>
          <p className="text-sm text-[#e5e7eb] leading-relaxed">{marketMood}</p>
        </div>
      )}
      {portfolioNote && (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <p className="text-xs text-[#6b7280] font-medium uppercase tracking-wide mb-2">Your portfolio</p>
          <p className="text-sm text-[#e5e7eb] leading-relaxed">{portfolioNote}</p>
        </div>
      )}
      {actionItems?.length > 0 && (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <p className="text-xs text-[#6b7280] font-medium uppercase tracking-wide mb-3">Suggested actions</p>
          <ul className="space-y-2">
            {actionItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#e5e7eb]">
                <span className="text-[#6366f1] mt-0.5 flex-shrink-0">→</span>
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
