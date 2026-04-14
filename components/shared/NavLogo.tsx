import { cn } from '@/lib/utils/cn'

interface NavLogoProps {
  collapsed?: boolean
  className?: string
}

export default function NavLogo({ collapsed, className }: NavLogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="w-7 h-7 rounded-md bg-[#6366f1] flex items-center justify-center flex-shrink-0">
        <span className="text-white font-bold text-xs">N</span>
      </div>
      {!collapsed && (
        <span className="text-white font-bold text-base tracking-tight">NAV</span>
      )}
    </div>
  )
}
