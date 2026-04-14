import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'NAV — Sign In',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0a0a0a]">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#6366f1] flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">NAV</span>
        </div>
        <p className="text-[#6b7280] text-sm text-center">
          Navigate, Activate, Validate
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-[#141414] border border-[#2a2a2a] rounded-[12px] p-6">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs text-[#4b5563] text-center max-w-xs">
        NAV provides research and analysis tools. Nothing on NAV constitutes financial advice.
      </p>
    </div>
  )
}
