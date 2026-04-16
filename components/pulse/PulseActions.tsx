'use client'

import { motion } from 'framer-motion'
import { Lightbulb } from 'lucide-react'

interface PulseActionsProps {
  actions: string[]
  learningBite: { topic: string; content: string }
  navTake: string
}

export default function PulseActions({ actions, learningBite, navTake }: PulseActionsProps) {
  return (
    <div className="space-y-3">
      {/* NAV's Take */}
      {navTake && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-to-r from-[#312e81]/20 to-[#141414] border border-[#6366f1]/20 rounded-xl p-4"
        >
          <div className="flex items-start gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/nav-icon-white.svg"
              alt=""
              width={14}
              height={11}
              className="mt-0.5 flex-shrink-0 opacity-70"
            />
            <div>
              <p className="text-[10px] text-[#818cf8] font-medium uppercase tracking-wide mb-1">
                NAV&apos;s take
              </p>
              <p className="text-sm text-[#d1d5db] leading-relaxed">{navTake}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Suggested actions */}
      {actions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4"
        >
          <p className="text-xs text-[#6b7280] font-medium uppercase tracking-wide mb-3">
            Suggested actions
          </p>
          <div className="space-y-2">
            {actions.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.06 }}
                className="flex items-start gap-2 text-sm text-[#e5e7eb]"
              >
                <span className="text-[#6366f1] mt-0.5 flex-shrink-0">&rarr;</span>
                <span className="leading-relaxed">{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Learning bite */}
      {learningBite.content && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-[#6366f1]/5 border border-[#6366f1]/15 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={14} className="text-[#818cf8]" />
            <p className="text-xs text-[#818cf8] font-medium uppercase tracking-wide">
              {learningBite.topic}
            </p>
          </div>
          <p className="text-sm text-[#d1d5db] leading-relaxed">{learningBite.content}</p>
        </motion.div>
      )}
    </div>
  )
}
