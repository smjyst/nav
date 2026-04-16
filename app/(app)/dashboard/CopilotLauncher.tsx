'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowUp, Sparkles } from 'lucide-react'
import { useCopilotStore } from '@/lib/stores/copilotStore'

const SUGGESTIONS = [
  "What's happening in the market today?",
  'Which coins have the strongest momentum?',
  'What are the biggest risks right now?',
  'Should I be buying or waiting?',
  'Break down Bitcoin for me',
  'What should I do with my portfolio?',
]

export default function CopilotLauncher() {
  const { open } = useCopilotStore()
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = '0'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [inputValue])

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    const text = inputValue.trim()
    if (!text) return
    open({ type: 'general', label: text })
    setInputValue('')
  }

  function handleSuggestion(prompt: string) {
    open({ type: 'general', label: prompt })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Show first 4 suggestions (deterministic — no Math.random to avoid hydration mismatch)
  // Shuffle happens client-side after mount
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const chips = useMemo(() => {
    if (!mounted) return SUGGESTIONS.slice(0, 4)
    // Rotate based on the current day so users see variety without hydration issues
    const dayOffset = new Date().getDate() % SUGGESTIONS.length
    const rotated = [...SUGGESTIONS.slice(dayOffset), ...SUGGESTIONS.slice(0, dayOffset)]
    return rotated.slice(0, 4)
  }, [mounted])

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative"
    >
      {/* Glow backdrop */}
      <div
        className={`absolute -inset-px rounded-[20px] transition-opacity duration-500 ${
          isFocused ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background:
            'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 50%, rgba(99,102,241,0.05) 100%)',
          filter: 'blur(20px)',
        }}
      />

      <div
        className={`relative rounded-[20px] border transition-all duration-300 ${
          isFocused
            ? 'border-[#6366f1]/40 bg-[#141414] shadow-lg shadow-[#6366f1]/5'
            : 'border-[#1f1f1f] bg-[#141414]/80'
        }`}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/nav-icon-white.svg" alt="" width={14} height={11} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                NAV Copilot
              </h3>
            </div>
            <span className="ml-auto flex items-center gap-1 text-[10px] text-[#6366f1]/60 bg-[#6366f1]/5 px-2 py-0.5 rounded-full">
              <Sparkles size={9} />
              AI-powered
            </span>
          </div>
        </div>

        {/* Input area */}
        <form onSubmit={handleSubmit} className="px-5 pb-3">
          <div
            className={`relative rounded-2xl border transition-all duration-200 ${
              isFocused
                ? 'border-[#6366f1]/30 bg-[#0a0a0a]'
                : 'border-[#2a2a2a] bg-[#0a0a0a]/60 hover:border-[#3a3a3a]'
            }`}
          >
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder="Ask NAV anything about crypto..."
              rows={1}
              className="w-full resize-none bg-transparent pl-4 pr-12 py-3.5 text-sm text-[#f9fafb] placeholder-[#4b5563] focus:outline-none leading-relaxed"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className={`absolute right-2 bottom-2 p-2 rounded-xl transition-all duration-200 ${
                inputValue.trim()
                  ? 'bg-[#6366f1] text-white hover:bg-[#4f46e5] shadow-md shadow-[#6366f1]/20'
                  : 'bg-[#1c1c1c] text-[#4b5563]'
              }`}
              aria-label="Send"
            >
              <ArrowUp size={14} />
            </button>
          </div>
        </form>

        {/* Suggestion chips */}
        <div className="px-5 pb-4">
          <div className="flex flex-wrap gap-1.5">
            {chips.map((q) => (
              <button
                key={q}
                onClick={() => handleSuggestion(q)}
                className="px-3 py-1.5 text-[11px] rounded-full border border-[#2a2a2a] text-[#9ca3af] hover:text-white hover:border-[#6366f1]/30 hover:bg-[#6366f1]/5 transition-all duration-200"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
