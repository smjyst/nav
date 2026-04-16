'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Clock, Bell, BellOff, Check, Loader2 } from 'lucide-react'

interface Schedule {
  enabled: boolean
  time: string
  timezone: string
}

export default function PulseSchedule() {
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function fetchSchedule() {
      try {
        const res = await fetch('/api/ai/briefing/schedule')
        if (res.ok) {
          const data = await res.json()
          setSchedule({
            enabled: data.enabled,
            time: data.time,
            timezone: data.timezone,
          })
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchSchedule()
  }, [])

  const save = useCallback(
    async (updates: Partial<Schedule>) => {
      if (!schedule) return
      setSaving(true)
      setSaved(false)

      const newSchedule = { ...schedule, ...updates }
      setSchedule(newSchedule)

      try {
        const body: Record<string, unknown> = {}
        if (updates.enabled !== undefined) body.briefing_enabled = updates.enabled
        if (updates.time !== undefined) body.briefing_time = updates.time

        const res = await fetch('/api/ai/briefing/schedule', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (res.ok) {
          setSaved(true)
          setTimeout(() => setSaved(false), 2000)
        } else {
          // Revert on failure
          setSchedule(schedule)
        }
      } catch {
        setSchedule(schedule)
      } finally {
        setSaving(false)
      }
    },
    [schedule],
  )

  if (loading || !schedule) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-[#6b7280]" />
          <span className="text-xs font-semibold text-[#9ca3af]">
            Daily Schedule
          </span>
        </div>
        {saving && (
          <span className="flex items-center gap-1 text-[10px] text-[#6b7280]">
            <Loader2 size={10} className="animate-spin" />
            Saving...
          </span>
        )}
        {saved && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1 text-[10px] text-[#10b981]"
          >
            <Check size={10} />
            Saved
          </motion.span>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Toggle */}
        <button
          onClick={() => save({ enabled: !schedule.enabled })}
          className="flex items-center gap-3 flex-1"
        >
          <div
            className={`relative w-9 h-5 rounded-full transition-colors ${
              schedule.enabled ? 'bg-[#6366f1]' : 'bg-[#2a2a2a]'
            }`}
          >
            <motion.div
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
              animate={{ left: schedule.enabled ? 18 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </div>
          <div className="text-left">
            <p className="text-xs font-medium text-white">
              {schedule.enabled ? 'Auto-generate daily' : 'Manual only'}
            </p>
            <p className="text-[10px] text-[#6b7280]">
              {schedule.enabled
                ? `Briefing generated at ${schedule.time} ${schedule.timezone}`
                : 'Click to enable daily auto-briefings'}
            </p>
          </div>
        </button>

        {/* Time picker */}
        {schedule.enabled && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            className="flex-shrink-0"
          >
            <select
              value={schedule.time}
              onChange={(e) => save({ time: e.target.value })}
              className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-[#f9fafb] focus:outline-none focus:border-[#6366f1]/50 transition-colors"
            >
              {generateTimeOptions().map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </motion.div>
        )}
      </div>

      {schedule.enabled && (
        <div className="mt-3 flex items-center gap-2 pt-3 border-t border-[#1f1f1f]">
          <Bell size={10} className="text-[#6366f1]" />
          <p className="text-[10px] text-[#6b7280]">
            NAV will analyse overnight market moves, trending news, and your portfolio each morning.
          </p>
        </div>
      )}
    </motion.div>
  )
}

function generateTimeOptions(): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = []
  for (let h = 5; h <= 22; h++) {
    for (const m of ['00', '30']) {
      const val = `${String(h).padStart(2, '0')}:${m}`
      const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h
      const ampm = h >= 12 ? 'PM' : 'AM'
      options.push({ value: val, label: `${hour12}:${m} ${ampm}` })
    }
  }
  return options
}
