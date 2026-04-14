'use client'

import { create } from 'zustand'

interface CopilotState {
  isOpen: boolean
  contextType: 'portfolio' | 'token' | 'general' | null
  contextId: string | null
  contextLabel: string | null

  open: (context?: { type: 'portfolio' | 'token' | 'general'; id?: string; label?: string }) => void
  close: () => void
  toggle: () => void
  setContext: (type: 'portfolio' | 'token' | 'general', id?: string, label?: string) => void
}

export const useCopilotStore = create<CopilotState>((set, get) => ({
  isOpen: false,
  contextType: 'general',
  contextId: null,
  contextLabel: null,

  open: (context) => {
    if (context) {
      set({
        isOpen: true,
        contextType: context.type,
        contextId: context.id ?? null,
        contextLabel: context.label ?? null,
      })
    } else {
      set({ isOpen: true })
    }
  },

  close: () => set({ isOpen: false }),

  toggle: () => set((state) => ({ isOpen: !state.isOpen })),

  setContext: (type, id, label) =>
    set({ contextType: type, contextId: id ?? null, contextLabel: label ?? null }),
}))
