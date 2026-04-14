'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
    } else {
      router.push('/onboarding')
      router.refresh()
    }
  }

  return (
    <>
      <h1 className="text-xl font-semibold text-white mb-1">Create your account</h1>
      <p className="text-sm text-[#6b7280] mb-6">
        Start making smarter crypto decisions
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-[#7f1d1d]/30 border border-[#ef4444]/20 text-[#ef4444] text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-sm text-[#9ca3af] mb-1.5">Your name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            autoComplete="name"
            placeholder="Alex"
            className="w-full bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#f9fafb] placeholder-[#4b5563] focus:outline-none focus:border-[#6366f1]/50 transition-colors"
          />
        </div>

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
            autoComplete="new-password"
            placeholder="Min 8 characters"
            className="w-full bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#f9fafb] placeholder-[#4b5563] focus:outline-none focus:border-[#6366f1]/50 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#6b7280]">
        Already have an account?{' '}
        <Link href="/login" className="text-[#818cf8] hover:text-[#a5b4fc] transition-colors">
          Sign in
        </Link>
      </p>
    </>
  )
}
