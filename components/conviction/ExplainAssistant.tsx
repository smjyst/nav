'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight } from 'lucide-react'
import { useCompletion } from '@ai-sdk/react'
import { useUserStore } from '@/lib/stores/userStore'
import { cn } from '@/lib/utils/cn'
import type { ConvictionOutlook, ConvictionConfidence } from '@/lib/supabase/types'

interface ConvictionData {
  coinName: string
  symbol: string
  score: number
  outlook: ConvictionOutlook
  confidence: ConvictionConfidence
  headline: string
  summary: string
  bullCase?: string
  bearCase?: string
  keyLevels?: { support?: number; resistance?: number }
  signalsUsed?: string[]
}

interface ExplainAssistantProps {
  conviction: ConvictionData
  onClose: () => void
}

interface QAPair {
  question: string
  answer: string
  isStreaming: boolean
}

/** Generate smart follow-up questions from the conviction context */
function getFollowUps(c: ConvictionData): string[] {
  const name = c.coinName
  const questions: string[] = []

  // Outlook-specific lead question
  if (c.score >= 65) {
    questions.push(`What's driving the bullish outlook for ${name}?`)
  } else if (c.score <= 35) {
    questions.push(`Why is ${name} looking bearish right now?`)
  } else {
    questions.push(`What's keeping ${name} in neutral territory?`)
  }

  // Key levels question
  if (c.keyLevels?.support || c.keyLevels?.resistance) {
    questions.push(`What do the support and resistance levels tell me?`)
  } else {
    questions.push(`What price levels should I keep an eye on?`)
  }

  // Actionable question based on outlook
  if (c.outlook === 'bull') {
    questions.push(`Is this a good entry point, or should I wait?`)
  } else if (c.outlook === 'bear') {
    questions.push(`Should I be concerned if I already hold ${name}?`)
  } else {
    questions.push(`What would tip this into a clearer buy or sell signal?`)
  }

  return questions
}

export default function ExplainAssistant({ conviction, onClose }: ExplainAssistantProps) {
  const { guidanceMode } = useUserStore()
  const [history, setHistory] = useState<QAPair[]>([])
  const [initialDone, setInitialDone] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const followUps = useMemo(() => getFollowUps(conviction), [conviction])
  const [usedQuestions, setUsedQuestions] = useState<Set<string>>(new Set())

  // Initial explanation — auto-fires on mount
  const {
    completion: initialExplanation,
    complete: triggerInitial,
    isLoading: isInitialLoading,
  } = useCompletion({ api: '/api/ai/explain' })

  // Follow-up answers
  const {
    completion: followUpAnswer,
    complete: triggerFollowUp,
    isLoading: isFollowUpLoading,
  } = useCompletion({ api: '/api/ai/explain' })

  // Auto-trigger initial explanation on mount
  useEffect(() => {
    triggerInitial('', {
      body: {
        coinName: conviction.coinName,
        symbol: conviction.symbol,
        score: conviction.score,
        outlook: conviction.outlook,
        headline: conviction.headline,
        summary: conviction.summary,
        bullCase: conviction.bullCase,
        bearCase: conviction.bearCase,
        guidanceMode,
      },
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Mark initial as done when streaming finishes
  useEffect(() => {
    if (!isInitialLoading && initialExplanation && !initialDone) {
      setInitialDone(true)
    }
  }, [isInitialLoading, initialExplanation, initialDone])

  // When a follow-up finishes streaming, save it to history
  useEffect(() => {
    if (!isFollowUpLoading && followUpAnswer) {
      setHistory((prev) => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last && last.isStreaming) {
          updated[updated.length - 1] = { ...last, answer: followUpAnswer, isStreaming: false }
        }
        return updated
      })
    }
  }, [isFollowUpLoading, followUpAnswer])

  // Scroll to bottom on new content
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [initialExplanation, followUpAnswer, history.length])

  function handleFollowUp(question: string) {
    if (isFollowUpLoading) return
    setUsedQuestions((prev) => new Set(prev).add(question))
    setHistory((prev) => [...prev, { question, answer: '', isStreaming: true }])

    triggerFollowUp('', {
      body: {
        coinName: conviction.coinName,
        symbol: conviction.symbol,
        score: conviction.score,
        outlook: conviction.outlook,
        headline: conviction.headline,
        summary: conviction.summary,
        bullCase: conviction.bullCase,
        bearCase: conviction.bearCase,
        guidanceMode,
        followUpQuestion: question,
      },
    })
  }

  const availableFollowUps = followUps.filter((q) => !usedQuestions.has(q))
  const showFollowUps = initialDone && !isFollowUpLoading && availableFollowUps.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="rounded-xl border border-[#6366f1]/20 bg-gradient-to-b from-[#1a1744]/50 to-[#141414] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#6366f1]/10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#6366f1]/15 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/nav-icon-white.svg" alt="NAV" width={15} height={12} />
          </div>
          <div>
            <p className="text-sm font-medium text-white leading-tight">
              Here&apos;s what I&apos;m seeing
            </p>
            <p className="text-[10px] text-[#6b7280]">NAV Signal breakdown</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#1c1c1c] transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div ref={scrollRef} className="max-h-[400px] overflow-y-auto">
        <div className="px-4 py-4 space-y-4">
          {/* Initial explanation */}
          <div className="text-sm text-[#d1d5db] leading-relaxed">
            {initialExplanation || (
              <span className="flex items-center gap-2 text-[#6b7280]">
                <span className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1 h-1 rounded-full bg-[#6366f1]"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                    />
                  ))}
                </span>
                Thinking...
              </span>
            )}
            {isInitialLoading && initialExplanation && (
              <motion.span
                className="inline-block w-0.5 h-3.5 bg-[#6366f1] ml-0.5 align-middle"
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
              />
            )}
          </div>

          {/* Follow-up Q&A history */}
          {history.map((qa, i) => (
            <div key={i} className="space-y-3">
              {/* User question */}
              <div className="flex justify-end">
                <div className="bg-[#1c1c1c] rounded-xl rounded-tr-sm px-3 py-2 max-w-[85%]">
                  <p className="text-sm text-[#e5e7eb]">{qa.question}</p>
                </div>
              </div>

              {/* Assistant answer */}
              <div className="text-sm text-[#d1d5db] leading-relaxed">
                {qa.isStreaming ? (
                  <>
                    {followUpAnswer || (
                      <span className="flex items-center gap-2 text-[#6b7280]">
                        <span className="flex gap-0.5">
                          {[0, 1, 2].map((j) => (
                            <motion.span
                              key={j}
                              className="w-1 h-1 rounded-full bg-[#6366f1]"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ repeat: Infinity, duration: 1, delay: j * 0.2 }}
                            />
                          ))}
                        </span>
                        Thinking...
                      </span>
                    )}
                    {followUpAnswer && isFollowUpLoading && (
                      <motion.span
                        className="inline-block w-0.5 h-3.5 bg-[#6366f1] ml-0.5 align-middle"
                        animate={{ opacity: [1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                      />
                    )}
                  </>
                ) : (
                  qa.answer
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Follow-up questions */}
        <AnimatePresence>
          {showFollowUps && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="px-4 pb-4"
            >
              <p className="text-[11px] text-[#6b7280] mb-2">Want to know more?</p>
              <div className="space-y-1.5">
                {availableFollowUps.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleFollowUp(q)}
                    className={cn(
                      'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left',
                      'bg-[#0a0a0a]/60 border border-[#2a2a2a] hover:border-[#6366f1]/30 hover:bg-[#1c1c1c]',
                      'transition-all group',
                    )}
                  >
                    <span className="text-xs text-[#9ca3af] group-hover:text-white transition-colors">
                      {q}
                    </span>
                    <ChevronRight size={12} className="text-[#4b5563] group-hover:text-[#6366f1] shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[#1f1f1f]">
        <p className="text-[9px] text-[#4b5563] text-center">
          Analysis, not advice — always do your own research
        </p>
      </div>
    </motion.div>
  )
}
