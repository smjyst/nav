import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

interface NavLogoProps {
  collapsed?: boolean
  className?: string
}

export default function NavLogo({ collapsed, className }: NavLogoProps) {
  if (collapsed) {
    return (
      <div className={cn('flex items-center', className)}>
        <Image src="/nav-icon-white.svg" alt="NAV" width={28} height={22} className="flex-shrink-0" />
      </div>
    )
  }

  return (
    <div className={cn('flex items-center', className)}>
      <Image src="/nav-logo-full.svg" alt="NAV" width={100} height={28} priority />
    </div>
  )
}
