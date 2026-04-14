import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'NAV — Navigate, Activate, Validate',
  description: 'Your AI-powered crypto investment partner. Research-backed insights for confident decisions.',
  keywords: ['crypto', 'bitcoin', 'investment', 'AI', 'portfolio', 'blockchain'],
  openGraph: {
    title: 'NAV — Smarter Crypto Decisions',
    description: 'Navigate the crypto market with confidence. AI-powered insights, no jargon.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="h-full bg-[#0a0a0a] text-[#f9fafb] antialiased">
        {children}
      </body>
    </html>
  )
}
