'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/userStore'
import type { GuidanceMode, RiskProfile } from '@/lib/supabase/types'

interface Profile {
  id: string
  display_name: string | null
  guidance_mode: GuidanceMode
  risk_profile: RiskProfile
  briefing_enabled: boolean
  briefing_time: string
}

interface SettingsClientProps {
  profile: Profile | null
}

export default function SettingsClient({ profile }: SettingsClientProps) {
  const { setGuidanceMode, setRiskProfile } = useUserStore()

  const [guidanceMode, setLocalGuidance] = useState<GuidanceMode>(profile?.guidance_mode ?? 'beginner')
  const [riskProfile, setLocalRisk] = useState<RiskProfile>(profile?.risk_profile ?? 'moderate')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ guidance_mode: guidanceMode, risk_profile: riskProfile })
      .eq('id', profile!.id)

    setGuidanceMode(guidanceMode)
    setRiskProfile(riskProfile)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Guidance mode */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-1">Guidance mode</h2>
        <p className="text-xs text-[#6b7280] mb-4">Controls how NAV explains things to you</p>
        <div className="space-y-2">
          {(['beginner', 'intermediate', 'advanced'] as GuidanceMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setLocalGuidance(mode)}
              className="w-full text-left flex items-center justify-between p-3 rounded-lg border transition-colors"
              style={{
                backgroundColor: guidanceMode === mode ? '#312e81' : '#1c1c1c',
                borderColor: guidanceMode === mode ? '#6366f1' : '#2a2a2a',
              }}
            >
              <span className="text-sm text-white capitalize">{mode}</span>
              {guidanceMode === mode && (
                <span className="w-4 h-4 rounded-full bg-[#6366f1] flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-white" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Risk profile */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-1">Risk profile</h2>
        <p className="text-xs text-[#6b7280] mb-4">NAV tailors recommendations to your risk tolerance</p>
        <div className="space-y-2">
          {(['conservative', 'moderate', 'aggressive'] as RiskProfile[]).map((r) => (
            <button
              key={r}
              onClick={() => setLocalRisk(r)}
              className="w-full text-left flex items-center justify-between p-3 rounded-lg border transition-colors"
              style={{
                backgroundColor: riskProfile === r ? '#312e81' : '#1c1c1c',
                borderColor: riskProfile === r ? '#6366f1' : '#2a2a2a',
              }}
            >
              <span className="text-sm text-white capitalize">{r}</span>
              {riskProfile === r && (
                <span className="w-4 h-4 rounded-full bg-[#6366f1] flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-white" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save changes'}
      </button>
    </div>
  )
}
