'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GuidanceMode, RiskProfile } from '@/lib/supabase/types'

interface UserState {
  guidanceMode: GuidanceMode
  riskProfile: RiskProfile
  onboardingCompleted: boolean
  userId: string | null

  setGuidanceMode: (mode: GuidanceMode) => void
  setRiskProfile: (profile: RiskProfile) => void
  setOnboardingCompleted: (completed: boolean) => void
  setUserId: (id: string | null) => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      guidanceMode: 'beginner',
      riskProfile: 'moderate',
      onboardingCompleted: false,
      userId: null,

      setGuidanceMode: (mode) => set({ guidanceMode: mode }),
      setRiskProfile: (profile) => set({ riskProfile: profile }),
      setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
      setUserId: (id) => set({ userId: id }),
    }),
    {
      name: 'nav-user-store',
      partialize: (state) => ({
        guidanceMode: state.guidanceMode,
        riskProfile: state.riskProfile,
        onboardingCompleted: state.onboardingCompleted,
      }),
    },
  ),
)
