'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Send, Sparkles, Bot } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCopilotStore } from '@/lib/stores/copilotStore'
import { useUserStore } from '@/lib/stores/userStore'
import { cn } from '@/lib/utils/cn'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function CopilotPanel() {
  const { isOpen, close, contextType, contextLabel } = useCopilotStore()
  const { guidanceMode, riskProfile } = useUserStore()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-send when opened with a quick prompt (contextLabel)
  const lastLabelRef = useRef<string | null>(null)
  useEffect(() => {
    if (isOpen && contextLabel && contextLabel !== lastLabelRef.current && messages.length === 0) {
      lastLabelRef.current = contextLabel
      sendMessage(contextLabel)
    }
  }, [isOpen, contextLabel]) // eslint-disable-line react-hooks/exhaustive-deps

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
    const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: '' }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setInput('')
    setIsLoading(true)

    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          guidanceMode,
          riskProfile,
          contextType,
        }),
      })

      if (!res.ok || !res.body) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: 'Something went wrong. Please try again.' } : m,
          ),
        )
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: m.content + chunk } : m)),
        )
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id ? { ...m, content: 'Connection error. Please try again.' } : m,
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  const STARTERS = [
    "What should I do today?",
    "What's moving the market?",
    'Review my portfolio',
    'Explain Bitcoin to me',
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (mobile only) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-40 bg-black/60"
            onClick={close}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed z-50 flex flex-col bg-[#0a0a0a] border-l border-[#1f1f1f]',
              'right-0 top-0 bottom-0',
              'w-full md:w-[380px]',
              'md:top-0 bottom-16 md:bottom-0',
            )}
          >
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-[#1f1f1f] flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#6366f1] flex items-center justify-center">
                  <Sparkles size={12} className="text-white" />
                </div>
                <div>
                  <span className="text-white text-sm font-semibold">NAV Copilot</span>
                  {contextLabel && (
                    <span className="text-[#6b7280] text-xs ml-2">— {contextLabel}</span>
                  )}
                </div>
              </div>
              <button
                onClick={close}
                className="text-[#6b7280] hover:text-[#9ca3af] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
                  <div className="w-12 h-12 rounded-full bg-[#6366f1]/10 flex items-center justify-center">
                    <Bot size={24} className="text-[#6366f1]" />
                  </div>
                  <div className="text-center">
                    <p className="text-[#9ca3af] text-sm mb-1">
                      Ask me anything about the market
                    </p>
                    <p className="text-[#4b5563] text-xs">
                      I know your portfolio and the current market
                    </p>
                  </div>

                  {/* Starter prompts */}
                  <div className="flex flex-col gap-2 w-full">
                    {STARTERS.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="text-left text-sm px-3 py-2 rounded-lg border border-[#2a2a2a] text-[#6b7280] hover:text-[#9ca3af] hover:border-[#3f3f3f] hover:bg-[#1c1c1c] transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    'flex gap-3',
                    m.role === 'user' ? 'flex-row-reverse' : 'flex-row',
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
                      m.role === 'user'
                        ? 'bg-[#1c1c1c] text-[#9ca3af]'
                        : 'bg-[#6366f1] text-white',
                    )}
                  >
                    {m.role === 'user' ? 'U' : 'N'}
                  </div>

                  {/* Bubble */}
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                      m.role === 'user'
                        ? 'bg-[#1c1c1c] text-[#f9fafb] rounded-tr-sm'
                        : 'bg-[#141414] text-[#e5e7eb] rounded-tl-sm border border-[#2a2a2a]',
                    )}
                  >
                    {m.content || (
                      isLoading && m.role === 'assistant' && (
                        <span className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.span
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-[#6b7280]"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                            />
                          ))}
                        </span>
                      )
                    )}
                  </div>
                </div>
              ))}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-[#1f1f1f] flex-shrink-0">
              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage(input)
                    }
                  }}
                  placeholder="Ask NAV anything..."
                  rows={1}
                  className="flex-1 resize-none bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm text-[#f9fafb] placeholder-[#4b5563] focus:outline-none focus:border-[#6366f1]/50 transition-colors min-h-[40px]"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="w-10 h-10 rounded-xl bg-[#6366f1] flex items-center justify-center text-white transition-colors hover:bg-[#4f46e5] disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Send size={15} />
                </button>
              </form>
              <p className="text-[10px] text-[#4b5563] mt-2 text-center">
                Not financial advice · Your data stays private
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
