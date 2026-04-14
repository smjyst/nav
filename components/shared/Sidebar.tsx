'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  Shield,
  Wallet,
  Bell,
  Newspaper,
  Settings,
  MessageSquare,
  Search,
} from 'lucide-react'
import NavLogo from './NavLogo'
import { useCopilotStore } from '@/lib/stores/copilotStore'
import { cn } from '@/lib/utils/cn'

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/markets',    label: 'Markets',       icon: TrendingUp },
  { href: '/portfolio',  label: 'Portfolio',     icon: Briefcase },
  { href: '/validate',   label: 'Validate',      icon: Shield },
  { href: '/wallet',     label: 'Wallet',        icon: Wallet },
  { href: '/briefing',   label: 'Briefing',      icon: Newspaper },
  { href: '/alerts',     label: 'Alerts',        icon: Bell },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { open: openCopilot } = useCopilotStore()

  return (
    <aside className="hidden md:flex flex-col w-56 flex-shrink-0 bg-[#0a0a0a] border-r border-[#1f1f1f] h-screen sticky top-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-[#1f1f1f]">
        <NavLogo />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-[#6366f1]/10 text-[#818cf8]'
                      : 'text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#1c1c1c]',
                  )}
                >
                  <Icon
                    size={16}
                    className={cn(active ? 'text-[#6366f1]' : 'text-current')}
                  />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom actions */}
      <div className="p-2 border-t border-[#1f1f1f] space-y-0.5">
        {/* NAV Copilot button */}
        <button
          onClick={() => openCopilot({ type: 'general' })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-[#818cf8] hover:bg-[#6366f1]/10 transition-colors"
        >
          <MessageSquare size={16} className="text-[#6366f1]" />
          NAV Copilot
        </button>

        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            pathname === '/settings'
              ? 'bg-[#6366f1]/10 text-[#818cf8]'
              : 'text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#1c1c1c]',
          )}
        >
          <Settings size={16} />
          Settings
        </Link>
      </div>
    </aside>
  )
}
