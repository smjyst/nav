'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <>
      <h1 className="text-xl font-semibold text-white mb-1">Welcome back</h1>
      <p className="text-sm text-[#6b7280] mb-6">Sign in to your NAV account</p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-[#7f1d1d]/30 border border-[#ef4444]/20 text-[#ef4444] text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm text-[#9ca3af] mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#f9fafb] placeholder-[#4b5563] focus:outline-none focus:border-[#6366f1]/50 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm text-[#9ca3af] mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#f9fafb] placeholder-[#4b5563] focus:outline-none focus:border-[#6366f1]/50 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#6b7280]">
        No account?{' '}
        <Link href="/signup" className="text-[#818cf8] hover:text-[#a5b4fc] transition-colors">
          Create one free
        </Link>
      </p>
    </>
  )
}
