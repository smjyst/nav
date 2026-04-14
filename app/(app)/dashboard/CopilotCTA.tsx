'use client'

import { Sparkles } from 'lucide-react'
import { useCopilotStore } from '@/lib/stores/copilotStore'

export default function CopilotCTA() {
  const { open } = useCopilotStore()

  return (
    <div className="bg-gradient-to-r from-[#312e81]/30 to-[#1e1b4b]/30 border border-[#6366f1]/20 rounded-xl p-5 flex items-center justify-between gap-4">
      <div>
        <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
          <Sparkles size={16} className="text-[#818cf8]" />
          Ask NAV Copilot
        </h3>
        <p className="text-sm text-[#9ca3af]">
          &ldquo;What should I do today?&rdquo; · &ldquo;Why is ETH down?&rdquo; · &ldquo;Is now a good time to buy Bitcoin?&rdquo;
        </p>
      </div>
      <button
        onClick={() => open()}
        className="flex-shrink-0 px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-medium rounded-lg transition-colors"
      >
        Ask
      </button>
    </div>
  )
}
