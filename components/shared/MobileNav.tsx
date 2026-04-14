'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  Shield,
  MessageSquare,
} from 'lucide-react'
import { useCopilotStore } from '@/lib/stores/copilotStore'
import { cn } from '@/lib/utils/cn'

const MOBILE_ITEMS = [
  { href: '/dashboard', label: 'Home',     icon: LayoutDashboard },
  { href: '/markets',   label: 'Markets',  icon: TrendingUp },
  { href: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { href: '/validate',  label: 'Validate', icon: Shield },
]

export default function MobileNav() {
  const pathname = usePathname()
  const { open: openCopilot, isOpen } = useCopilotStore()

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0a0a0a] border-t border-[#1f1f1f] safe-area-bottom">
      <ul className="flex items-stretch h-16">
        {MOBILE_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center h-full gap-1 text-[10px] font-medium transition-colors',
                  active ? 'text-[#6366f1]' : 'text-[#4b5563]',
                )}
              >
                <Icon size={20} />
                {label}
              </Link>
            </li>
          )
        })}

        {/* Copilot tab */}
        <li className="flex-1">
          <button
            onClick={() => openCopilot({ type: 'general' })}
            className={cn(
              'flex flex-col items-center justify-center h-full w-full gap-1 text-[10px] font-medium transition-colors',
              isOpen ? 'text-[#6366f1]' : 'text-[#4b5563]',
            )}
          >
            <MessageSquare size={20} />
            Copilot
          </button>
        </li>
      </ul>
    </nav>
  )
}
