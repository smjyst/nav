import ValidateClient from './ValidateClient'
import { Shield } from 'lucide-react'

export const metadata = { title: 'Validate — NAV' }

export default function ValidatePage() {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-[#6366f1]/10 flex items-center justify-center">
            <Shield size={18} className="text-[#6366f1]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">NAV Validate</h1>
            <p className="text-xs text-[#6b7280]">Validate Before You Buy</p>
          </div>
        </div>
        <p className="text-sm text-[#9ca3af] leading-relaxed">
          Paste a token name or contract address before you buy. NAV checks legitimacy, risk flags, and entry timing — so you can invest with confidence.
        </p>
      </div>
      <ValidateClient />
    </div>
  )
}
