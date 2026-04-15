'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/userStore'
import type { GuidanceMode, RiskProfile } from '@/lib/supabase/types'

interface Step {
  id: string
  title: string
  subtitle: string
}

const STEPS: Step[] = [
  { id: 'experience', title: 'How familiar are you with crypto?', subtitle: "This helps NAV explain things at the right level for you." },
  { id: 'risk',       title: 'How would you describe your risk appetite?', subtitle: "NAV will personalise recommendations based on this." },
  { id: 'goals',      title: 'What brings you to crypto?', subtitle: "No wrong answers — this helps NAV focus on what matters to you." },
]

const EXPERIENCE_OPTIONS: Array<{ value: GuidanceMode; label: string; desc: string }> = [
  { value: 'beginner',     label: '🌱 I\'m new to this',        desc: 'I\'ve heard of Bitcoin but haven\'t invested yet, or just started.' },
  { value: 'intermediate', label: '📈 I know the basics',       desc: 'I\'ve bought crypto before and understand the fundamentals.' },
  { value: 'advanced',     label: '🔬 I\'m experienced',        desc: 'I understand on-chain metrics, DeFi, and technical analysis.' },
]

const RISK_OPTIONS: Array<{ value: RiskProfile; label: string; desc: string }> = [
  { value: 'conservative', label: '🛡️ Cautious',   desc: 'I prefer stability. I\'d rather miss gains than take big losses.' },
  { value: 'moderate',     label: '⚖️ Balanced',   desc: 'I\'m comfortable with some volatility for better potential returns.' },
  { value: 'aggressive',   label: '🚀 Growth',     desc: 'I can handle big swings. I\'m here for meaningful upside.' },
]

const GOAL_OPTIONS = [
  { value: 'long_term',    label: '🌱 Long-term growth',     desc: 'I want to grow wealth over years, not weeks.' },
  { value: 'income',       label: '💰 Passive income',       desc: 'I\'m interested in staking, yield, and regular returns.' },
  { value: 'diversify',    label: '📊 Diversification',      desc: 'I want crypto as part of a broader investment strategy.' },
  { value: 'speculative',  label: '🎯 Speculative gains',    desc: 'I\'m happy to take on more risk for bigger upside.' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { setGuidanceMode, setRiskProfile, setOnboardingCompleted } = useUserStore()

  const [step, setStep] = useState(0)
  const [experience, setExperience] = useState<GuidanceMode | null>(null)
  const [risk, setRisk] = useState<RiskProfile | null>(null)
  const [goal, setGoal] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = back

  function next() {
    setDirection(1)
    setStep((s) => s + 1)
  }
  function prev() {
    setDirection(-1)
    setStep((s) => s - 1)
  }

  async function finish() {
    if (!experience || !risk) return
    setSaving(true)

    // Save to Zustand
    setGuidanceMode(experience)
    setRiskProfile(risk)
    setOnboardingCompleted(true)

    // Save to Supabase profile
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({
          guidance_mode: experience,
          risk_profile: risk,
          onboarding_completed: true,
        })
        .eq('id', user.id)
    }

    router.push('/dashboard')
    router.refresh()
  }

  const canProceed = [
    !!experience,
    !!risk,
    !!goal,
  ][step]

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/nav-logo-full.svg" alt="NAV" width={140} height={38} />
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="transition-all duration-300 rounded-full"
            style={{
              width: i === step ? 20 : 6,
              height: 6,
              backgroundColor: i <= step ? '#6366f1' : '#2a2a2a',
            }}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ x: direction * 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -40, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-white mb-2">
                {STEPS[step].title}
              </h2>
              <p className="text-sm text-[#6b7280]">{STEPS[step].subtitle}</p>
            </div>

            {/* Step 0: Experience */}
            {step === 0 && (
              <div className="space-y-3">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setExperience(opt.value)}
                    className="w-full text-left p-4 rounded-xl border transition-all"
                    style={{
                      backgroundColor: experience === opt.value ? '#312e81' : '#141414',
                      borderColor: experience === opt.value ? '#6366f1' : '#2a2a2a',
                    }}
                  >
                    <p className="text-white font-medium mb-1">{opt.label}</p>
                    <p className="text-xs text-[#6b7280]">{opt.desc}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Step 1: Risk */}
            {step === 1 && (
              <div className="space-y-3">
                {RISK_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRisk(opt.value)}
                    className="w-full text-left p-4 rounded-xl border transition-all"
                    style={{
                      backgroundColor: risk === opt.value ? '#312e81' : '#141414',
                      borderColor: risk === opt.value ? '#6366f1' : '#2a2a2a',
                    }}
                  >
                    <p className="text-white font-medium mb-1">{opt.label}</p>
                    <p className="text-xs text-[#6b7280]">{opt.desc}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Goals */}
            {step === 2 && (
              <div className="space-y-3">
                {GOAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setGoal(opt.value)}
                    className="w-full text-left p-4 rounded-xl border transition-all"
                    style={{
                      backgroundColor: goal === opt.value ? '#312e81' : '#141414',
                      borderColor: goal === opt.value ? '#6366f1' : '#2a2a2a',
                    }}
                  >
                    <p className="text-white font-medium mb-1">{opt.label}</p>
                    <p className="text-xs text-[#6b7280]">{opt.desc}</p>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 mt-8 w-full max-w-md">
        {step > 0 && (
          <button
            onClick={prev}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#2a2a2a] text-[#6b7280] hover:text-[#9ca3af] text-sm transition-colors"
          >
            <ChevronLeft size={16} />
            Back
          </button>
        )}
        <button
          onClick={step < STEPS.length - 1 ? next : finish}
          disabled={!canProceed || saving}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#6366f1] hover:bg-[#4f46e5] text-white font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? (
            'Setting up your account...'
          ) : step < STEPS.length - 1 ? (
            <>Continue <ChevronRight size={16} /></>
          ) : (
            <>Get started <CheckCircle2 size={16} /></>
          )}
        </button>
      </div>

      <p className="mt-4 text-xs text-[#4b5563] text-center">
        You can change these settings anytime
      </p>
    </div>
  )
}
