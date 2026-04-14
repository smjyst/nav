import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Tailwind class merge utility — used by all components
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
