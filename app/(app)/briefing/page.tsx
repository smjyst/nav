import { createClient } from '@/lib/supabase/server'
import { Activity } from 'lucide-react'
import PulseClient from './PulseClient'

export const metadata = { title: 'NAV Pulse — Daily Briefing' }

export default async function BriefingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const today = new Date().toISOString().split('T')[0]
  const { data: briefingRaw } = await supabase
    .from('daily_briefings')
    .select('*')
    .eq('user_id', user!.id)
    .eq('briefing_date', today)
    .single()

  const briefing = briefingRaw as {
    id: string
    content: Record<string, unknown>
    generated_at: string
  } | null

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#6366f1]/10 flex items-center justify-center">
            <Activity size={18} className="text-[#6366f1]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">NAV Pulse</h1>
            <p className="text-xs text-[#6b7280]">Your daily market briefing</p>
          </div>
        </div>
        <div className="text-xs text-[#4b5563] text-right">
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </div>
      </div>

      <PulseClient
        initialBriefing={briefing?.content as import('@/lib/agents/pulse').PulseOutput | null ?? null}
      />
    </div>
  )
}
