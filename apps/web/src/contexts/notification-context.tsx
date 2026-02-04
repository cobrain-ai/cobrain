'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'

export interface Notification {
  id: string
  message: string
  triggerAt: string
  type: 'time' | 'commitment' | 'follow_up'
  noteId: string
  notePreview: string
  recurring?: string | null
}

interface NotificationContextValue {
  notifications: Notification[]
  upcomingReminders: Notification[]
  pendingCount: number
  isLoading: boolean
  dismissNotification: (id: string) => Promise<void>
  completeNotification: (id: string) => Promise<void>
  snoozeNotification: (id: string, duration: string, customTime?: string) => Promise<void>
  refreshUpcoming: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

const POLL_INTERVAL = 30000 // 30 seconds

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [upcomingReminders, setUpcomingReminders] = useState<Notification[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Check for due reminders
  const checkReminders = useCallback(async () => {
    try {
      const response = await fetch('/api/reminders/check')
      if (response.ok) {
        const data = await response.json()
        if (data.reminders && data.reminders.length > 0) {
          setNotifications((prev) => {
            // Avoid duplicates
            const existingIds = new Set(prev.map((n) => n.id))
            const newNotifications = data.reminders.filter(
              (r: Notification) => !existingIds.has(r.id)
            )
            return [...newNotifications, ...prev]
          })
        }
      }
    } catch (error) {
      console.error('Failed to check reminders:', error)
    }
  }, [])

  // Fetch upcoming reminders
  const refreshUpcoming = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/reminders/upcoming?hours=24')
      if (response.ok) {
        const data = await response.json()
        setUpcomingReminders(data.reminders || [])
      }

      // Also get pending count
      const countResponse = await fetch('/api/reminders?status=pending&limit=1')
      if (countResponse.ok) {
        const countData = await countResponse.json()
        setPendingCount(countData.pendingCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch upcoming reminders:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Dismiss notification (remove from UI, mark as dismissed in DB)
  const dismissNotification = useCallback(async (id: string) => {
    try {
      await fetch(`/api/reminders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss' }),
      })
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (error) {
      console.error('Failed to dismiss notification:', error)
    }
  }, [])

  // Complete notification
  const completeNotification = useCallback(async (id: string) => {
    try {
      await fetch(`/api/reminders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      })
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      setPendingCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to complete notification:', error)
    }
  }, [])

  // Snooze notification
  const snoozeNotification = useCallback(
    async (id: string, duration: string, customTime?: string) => {
      try {
        await fetch(`/api/reminders/${id}/snooze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ duration, customTime }),
        })
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        // Refresh upcoming to show the snoozed reminder
        await refreshUpcoming()
      } catch (error) {
        console.error('Failed to snooze notification:', error)
      }
    },
    [refreshUpcoming]
  )

  // Set up polling interval
  useEffect(() => {
    // Initial check
    checkReminders()
    refreshUpcoming()

    // Set up interval
    intervalRef.current = setInterval(checkReminders, POLL_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [checkReminders, refreshUpcoming])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        upcomingReminders,
        pendingCount,
        isLoading,
        dismissNotification,
        completeNotification,
        snoozeNotification,
        refreshUpcoming,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
