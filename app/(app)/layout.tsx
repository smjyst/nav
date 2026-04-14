import Sidebar from '@/components/shared/Sidebar'
import MobileNav from '@/components/shared/MobileNav'
import CopilotPanel from '@/components/copilot/CopilotPanel'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a]">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="min-h-full">
          {children}
        </div>
      </main>

      {/* NAV Copilot (slide-in panel) */}
      <CopilotPanel />

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  )
}
