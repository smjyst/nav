'use client'

import { useState } from 'react'
import { Sparkles, Send, MessageSquare, TrendingUp, Shield, Zap } from 'lucide-react'
import { useCopilotStore } from '@/lib/stores/copilotStore'

const QUICK_PROMPTS = [
  { icon: TrendingUp, label: 'Market overview', prompt: "What's happening in the crypto market today?", color: '#10b981' },
  { icon: Shield, label: 'Risk check', prompt: 'What are the biggest risks in the market right now?', color: '#f59e0b' },
  { icon: Zap, label: 'Top opportunities', prompt: 'Which coins have the strongest momentum this week?', color: '#6366f1' },
  { icon: MessageSquare, label: 'Portfolio advice', prompt: "What should I do with my portfolio today?", color: '#ec4899' },
]

export default function CopilotLauncher() {
  const { open } = useCopilotStore()
  const [inputValue, setInputValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!inputValue.trim()) return
    open({ type: 'general' })
    // The copilot panel will open — the user can type there
    setInputValue('')
  }

  function handleQuickPrompt(prompt: string) {
    open({ type: 'general', label: prompt })
  }

  return (
    <div className="bg-gradient-to-br from-[#312e81]/20 via-[#1e1b4b]/20 to-[#141414] border border-[#6366f1]/15 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#6366f1]/15 flex items-center justify-center">
          <Sparkles size={16} className="text-[#818cf8]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">NAV Copilot</h3>
          <p className="text-[11px] text-[#6b7280]">Your AI research partner</p>
        </div>
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="relative">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => open({ type: 'general' })}
          placeholder="Ask anything about crypto..."
          className="w-full bg-[#0a0a0a]/60 border border-[#2a2a2a] hover:border-[#6366f1]/30 focus:border-[#6366f1]/50 rounded-xl pl-4 pr-10 py-3 text-sm text-[#f9fafb] placeholder-[#4b5563] focus:outline-none transition-colors"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#4b5563] hover:text-[#6366f1] hover:bg-[#6366f1]/10 transition-colors"
          aria-label="Send"
        >
          <Send size={14} />
        </button>
      </form>

      {/* Quick prompts */}
      <div className="grid grid-cols-2 gap-2">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q.label}
            onClick={() => handleQuickPrompt(q.prompt)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0a0a0a]/40 border border-[#1f1f1f] hover:border-[#2a2a2a] hover:bg-[#1c1c1c] transition-all text-left group"
          >
            <q.icon size={13} style={{ color: q.color }} className="shrink-0" />
            <span className="text-xs text-[#9ca3af] group-hover:text-white transition-colors truncate">
              {q.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
