'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, BellOff, Plus, Settings2, Filter } from 'lucide-react'
import AlertCard, { type AlertEventData } from '@/components/alerts/AlertCard'
import AlertConfigCard from '@/components/alerts/AlertConfigCard'
import CreateAlertModal from '@/components/alerts/CreateAlertModal'
import type { AlertType } from '@/lib/supabase/types'

interface AlertConfigData {
  id: string
  alert_type: AlertType
  coin_id: string | null
  config: Record<string, unknown>
  is_active: boolean
  created_at: string
}

type Tab = 'feed' | 'configs'
type FilterMode = 'all' | 'unread'

export default function AlertsClient() {
  const [tab, setTab] = useState<Tab>('feed')
  const [filter, setFilter] = useState<FilterMode>('all')
  const [alerts, setAlerts] = useState<AlertEventData[]>([])
  const [configs, setConfigs] = useState<AlertConfigData[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  // Fetch alerts & configs on mount
  const fetchAlerts = useCallback(async () => {
    try {
      const url = filter === 'unread' ? '/api/alerts?unread=true' : '/api/alerts'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts ?? [])
      }
    } catch {
      // Silently fail
    }
  }, [filter])

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts/configs')
      if (res.ok) {
        const data = await res.json()
        setConfigs(data.configs ?? [])
      }
    } catch {
      // Silently fail
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchAlerts(), fetchConfigs()]).finally(() =>
      setLoading(false),
    )
  }, [fetchAlerts, fetchConfigs])

  // Re-fetch alerts when filter changes
  useEffect(() => {
    fetchAlerts()
  }, [filter, fetchAlerts])

  const handleMarkRead = useCallback(
    async (id: string) => {
      // Optimistic update
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)),
      )

      try {
        await fetch('/api/alerts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alertIds: [id] }),
        })
      } catch {
        // Revert on failure
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, is_read: false } : a)),
        )
      }
    },
    [],
  )

  const handleMarkAllRead = useCallback(async () => {
    const unread = alerts.filter((a) => !a.is_read)
    if (unread.length === 0) return

    // Optimistic
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })))

    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertIds: unread.map((a) => a.id) }),
      })
    } catch {
      // Don't revert — marking all read isn't critical
    }
  }, [alerts])

  const handleDeleteConfig = useCallback((id: string) => {
    setConfigs((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const unreadCount = alerts.filter((a) => !a.is_read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Tabs + actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-[#141414] border border-[#1f1f1f] rounded-lg p-0.5">
          <button
            onClick={() => setTab('feed')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              tab === 'feed'
                ? 'bg-[#6366f1]/10 text-[#818cf8]'
                : 'text-[#6b7280] hover:text-[#9ca3af]'
            }`}
          >
            Feed
            {unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-[#6366f1] text-white">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('configs')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              tab === 'configs'
                ? 'bg-[#6366f1]/10 text-[#818cf8]'
                : 'text-[#6b7280] hover:text-[#9ca3af]'
            }`}
          >
            <Settings2 size={12} className="inline mr-1" />
            My Alerts
            <span className="ml-1 text-[10px] text-[#4b5563]">
              ({configs.length})
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {tab === 'feed' && (
            <>
              <button
                onClick={() =>
                  setFilter((f) => (f === 'all' ? 'unread' : 'all'))
                }
                className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] rounded-lg border transition-colors ${
                  filter === 'unread'
                    ? 'bg-[#6366f1]/10 border-[#6366f1]/30 text-[#818cf8]'
                    : 'bg-[#141414] border-[#2a2a2a] text-[#6b7280] hover:text-[#9ca3af]'
                }`}
              >
                <Filter size={10} />
                {filter === 'unread' ? 'Unread' : 'All'}
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-[#6b7280] hover:text-[#9ca3af] transition-colors"
                >
                  Mark all read
                </button>
              )}
            </>
          )}
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-lg transition-colors"
          >
            <Plus size={12} />
            New
          </button>
        </div>
      </div>

      {/* Feed tab */}
      <AnimatePresence mode="wait">
        {tab === 'feed' && (
          <motion.div
            key="feed"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            {alerts.length === 0 ? (
              <EmptyState
                type="feed"
                onCreateAlert={() => setShowCreate(true)}
              />
            ) : (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onMarkRead={handleMarkRead}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Configs tab */}
        {tab === 'configs' && (
          <motion.div
            key="configs"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            {configs.length === 0 ? (
              <EmptyState
                type="configs"
                onCreateAlert={() => setShowCreate(true)}
              />
            ) : (
              <div className="space-y-2">
                {configs.map((config) => (
                  <AlertConfigCard
                    key={config.id}
                    config={config}
                    onDelete={handleDeleteConfig}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateAlertModal
            open={showCreate}
            onClose={() => setShowCreate(false)}
            onCreated={() => {
              fetchConfigs()
              setTab('configs')
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function EmptyState({
  type,
  onCreateAlert,
}: {
  type: 'feed' | 'configs'
  onCreateAlert: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-center mb-4">
        <BellOff size={20} className="text-[#4b5563]" />
      </div>
      <h2 className="text-base font-semibold text-white mb-2">
        {type === 'feed' ? 'No alerts yet' : 'No alerts configured'}
      </h2>
      <p className="text-sm text-[#6b7280] max-w-xs mb-4">
        {type === 'feed'
          ? 'Set up alerts to get notified about price targets, conviction changes, and portfolio risks.'
          : 'Create your first alert to start receiving notifications about the things that matter to you.'}
      </p>
      <button
        onClick={onCreateAlert}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-xl transition-colors"
      >
        <Plus size={14} />
        Create alert
      </button>
    </div>
  )
}
