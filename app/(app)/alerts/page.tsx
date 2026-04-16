import { Bell } from 'lucide-react'
import AlertsClient from './AlertsClient'

export const metadata = { title: 'Alerts — NAV' }

export default function AlertsPage() {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-[#6366f1]/10 flex items-center justify-center">
            <Bell size={18} className="text-[#6366f1]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Smart Alerts</h1>
            <p className="text-xs text-[#6b7280]">NAV Guard</p>
          </div>
        </div>
        <p className="text-sm text-[#9ca3af] leading-relaxed">
          Set up alerts for price targets, conviction changes, and portfolio risks. NAV watches so you don&apos;t have to.
        </p>
      </div>
      <AlertsClient />
    </div>
  )
}
