import { createClient } from '@/lib/supabase/server'
import { Bell, BellOff } from 'lucide-react'
import { timeSince } from '@/lib/utils/formatting'

export const metadata = { title: 'Alerts — NAV' }

const SEVERITY_COLORS: Record<string, string> = {
  info: '#6b7280',
  warning: '#f59e0b',
  critical: '#ef4444',
}

export default async function AlertsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: alertsRaw } = await supabase
    .from('alert_events')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const alerts = alertsRaw as Array<{
    id: string
    alert_type: string
    severity: string
    title: string
    body: string
    is_read: boolean
    created_at: string
  }> | null

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Alerts</h1>
        <p className="text-sm text-[#6b7280]">Conviction changes, risk warnings, and market events</p>
      </div>

      {!alerts || alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-center mb-4">
            <BellOff size={20} className="text-[#4b5563]" />
          </div>
          <h2 className="text-base font-semibold text-white mb-2">No alerts yet</h2>
          <p className="text-sm text-[#6b7280] max-w-xs">
            NAV will notify you of conviction changes, portfolio risks, and market events that matter to you.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-4 rounded-xl bg-[#141414] border border-[#1f1f1f]"
              style={{ borderLeftColor: SEVERITY_COLORS[alert.severity] ?? '#2a2a2a', borderLeftWidth: 3 }}
            >
              <Bell size={14} className="mt-0.5 flex-shrink-0" style={{ color: SEVERITY_COLORS[alert.severity] }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white mb-0.5">{alert.title}</p>
                <p className="text-xs text-[#9ca3af]">{alert.body}</p>
              </div>
              <span className="text-xs text-[#4b5563] flex-shrink-0">
                {timeSince(alert.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
