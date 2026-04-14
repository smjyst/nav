'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2 } from 'lucide-react'

export default function GenerateBriefingButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/briefing', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to generate briefing')
      router.refresh()
    } catch {
      setError('Could not generate briefing. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4">
      <button
        onClick={generate}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed mx-auto"
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Generating...</>
        ) : (
          <><Sparkles size={16} /> Generate today&apos;s briefing</>
        )}
      </button>
      {error && <p className="text-xs text-[#ef4444] text-center mt-2">{error}</p>}
    </div>
  )
}
