'use client'

import { useState, useEffect } from 'react'
import { useNotifications } from '@/contexts/notification-context'

const AUTO_DISMISS_MS = 30000 // 30 seconds

export function NotificationBanner() {
  const { notifications, dismissNotification, completeNotification, snoozeNotification } =
    useNotifications()
  const [showSnoozeOptions, setShowSnoozeOptions] = useState<string | null>(null)

  // Get the current notification to display (most recent)
  const currentNotification = notifications[0]

  // Auto-dismiss after 30 seconds
  useEffect(() => {
    if (!currentNotification) return

    const timer = setTimeout(() => {
      // Don't auto-dismiss, just hide the banner - user can see in notification center
      dismissNotification(currentNotification.id)
    }, AUTO_DISMISS_MS)

    return () => clearTimeout(timer)
  }, [currentNotification, dismissNotification])

  if (!currentNotification) {
    return null
  }

  const handleSnooze = async (duration: string) => {
    await snoozeNotification(currentNotification.id, duration)
    setShowSnoozeOptions(null)
  }

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-slide-down">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500 rounded-lg">
              <BellIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Reminder
            </span>
          </div>
          <button
            onClick={() => dismissNotification(currentNotification.id)}
            className="p-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
            aria-label="Dismiss"
          >
            <XIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          <p className="text-gray-900 dark:text-gray-100 font-medium">
            {currentNotification.message}
          </p>
          {currentNotification.notePreview && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              {currentNotification.notePreview}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => completeNotification(currentNotification.id)}
            className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Complete
          </button>

          <div className="relative flex-1">
            <button
              onClick={() =>
                setShowSnoozeOptions(
                  showSnoozeOptions === currentNotification.id ? null : currentNotification.id
                )
              }
              className="w-full px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors"
            >
              Snooze
            </button>

            {/* Snooze Options Dropdown */}
            {showSnoozeOptions === currentNotification.id && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {[
                  { label: '15 min', value: '15m' },
                  { label: '30 min', value: '30m' },
                  { label: '1 hour', value: '1h' },
                  { label: '3 hours', value: '3h' },
                  { label: 'Tomorrow 9am', value: 'tomorrow' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSnooze(option.value)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => dismissNotification(currentNotification.id)}
            className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors"
          >
            Dismiss
          </button>
        </div>

        {/* Queue indicator */}
        {notifications.length > 1 && (
          <div className="px-4 py-2 bg-gray-100 dark:bg-gray-900 text-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              +{notifications.length - 1} more notification{notifications.length > 2 ? 's' : ''}
            </span>
          </div>
        )}
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

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
