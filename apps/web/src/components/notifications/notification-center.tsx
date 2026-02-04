'use client'

import { useState, useRef, useEffect } from 'react'
import { useNotifications } from '@/contexts/notification-context'
import Link from 'next/link'

export function NotificationCenter() {
  const {
    notifications,
    upcomingReminders,
    pendingCount,
    isLoading,
    dismissNotification,
    completeNotification,
    snoozeNotification,
    refreshUpcoming,
  } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'triggered' | 'upcoming'>('triggered')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Refresh upcoming when opening
  useEffect(() => {
    if (isOpen) {
      refreshUpcoming()
    }
  }, [isOpen, refreshUpcoming])

  const totalCount = notifications.length + pendingCount

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffMins = Math.round(diffMs / 60000)

    if (diffMins < 0) {
      // Past
      const absMins = Math.abs(diffMins)
      if (absMins < 60) return `${absMins}m ago`
      if (absMins < 1440) return `${Math.round(absMins / 60)}h ago`
      return date.toLocaleDateString()
    } else {
      // Future
      if (diffMins < 60) return `in ${diffMins}m`
      if (diffMins < 1440) return `in ${Math.round(diffMins / 60)}h`
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <BellIcon className="w-5 h-5" />
        {totalCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full">
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={async () => {
                  for (const n of notifications) {
                    await dismissNotification(n.id)
                  }
                }}
                className="text-xs text-blue-500 hover:text-blue-600"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('triggered')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'triggered'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              New ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'upcoming'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Upcoming ({upcomingReminders.length})
            </button>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : activeTab === 'triggered' ? (
              notifications.length === 0 ? (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  <BellOffIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No new notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      formatTime={formatTime}
                      onComplete={() => completeNotification(notification.id)}
                      onDismiss={() => dismissNotification(notification.id)}
                      onSnooze={(duration) => snoozeNotification(notification.id, duration)}
                    />
                  ))}
                </div>
              )
            ) : upcomingReminders.length === 0 ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                <ClockIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming reminders</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {upcomingReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {reminder.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {formatTime(reminder.triggerAt)}
                        </p>
                      </div>
                      <Link
                        href={`/notes?highlight=${reminder.noteId}`}
                        className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        onClick={() => setIsOpen(false)}
                      >
                        <ExternalLinkIcon className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/reminders"
              className="block text-center text-sm text-blue-500 hover:text-blue-600"
              onClick={() => setIsOpen(false)}
            >
              View all reminders
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

// Notification Item Component
function NotificationItem({
  notification,
  formatTime,
  onComplete,
  onDismiss,
  onSnooze,
}: {
  notification: {
    id: string
    message: string
    triggerAt: string
    noteId: string
  }
  formatTime: (time: string) => string
  onComplete: () => void
  onDismiss: () => void
  onSnooze: (duration: string) => void
}) {
  const [showSnooze, setShowSnooze] = useState(false)

  return (
    <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {formatTime(notification.triggerAt)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={onComplete}
          className="px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
        >
          Complete
        </button>
        <div className="relative">
          <button
            onClick={() => setShowSnooze(!showSnooze)}
            className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            Snooze
          </button>
          {showSnooze && (
            <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-10">
              {[
                { label: '15m', value: '15m' },
                { label: '1h', value: '1h' },
                { label: 'Tomorrow', value: 'tomorrow' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSnooze(option.value)
                    setShowSnooze(false)
                  }}
                  className="block w-full px-3 py-1.5 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

// Icons
function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  )
}

function BellOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11M6 6l12 12M6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h8m4-13.66V5a2 2 0 10-4 0v.341"
      />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  )
}
