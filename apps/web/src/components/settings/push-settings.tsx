'use client'

import { useState } from 'react'
import { usePushNotifications } from '@/hooks/use-push-notifications'

export function PushSettings() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications()

  const [testSending, setTestSending] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe()
    } else {
      await subscribe()
    }
  }

  const handleTestNotification = async () => {
    setTestSending(true)
    setTestResult(null)

    const success = await sendTestNotification()
    setTestResult(success ? 'success' : 'error')
    setTestSending(false)

    // Clear result after 3 seconds
    setTimeout(() => setTestResult(null), 3000)
  }

  if (!isSupported) {
    return (
      <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
        <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
          Push Notifications Unavailable
        </h3>
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          Your browser doesn&apos;t support push notifications. Try using Chrome, Firefox, or Edge.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            Push Notifications
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Receive reminder alerts even when the browser tab is closed
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={isLoading || permission === 'denied'}
          className={`
            relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
            border-2 border-transparent transition-colors duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${isSubscribed ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
            ${isLoading || permission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          role="switch"
          aria-checked={isSubscribed}
        >
          <span
            className={`
              pointer-events-none inline-block h-5 w-5 transform rounded-full
              bg-white shadow ring-0 transition duration-200 ease-in-out
              ${isSubscribed ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </button>
      </div>

      {/* Permission Status */}
      {permission === 'denied' && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">
            Notification permission was denied. Please enable notifications in your browser settings.
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Test Notification */}
      {isSubscribed && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleTestNotification}
            disabled={testSending}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {testSending ? 'Sending...' : 'Send Test Notification'}
          </button>
          {testResult === 'success' && (
            <span className="text-sm text-green-600 dark:text-green-400">
              ✓ Test notification sent!
            </span>
          )}
          {testResult === 'error' && (
            <span className="text-sm text-red-600 dark:text-red-400">
              ✗ Failed to send test
            </span>
          )}
        </div>
      )}

      {/* Info */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          What you&apos;ll receive:
        </h4>
        <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
          <li>• Reminder notifications at the scheduled time</li>
          <li>• Quick actions to complete or snooze reminders</li>
          <li>• Click to view the related note</li>
        </ul>
      </div>

      {/* Status */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span
            className={`w-2 h-2 rounded-full ${
              isSubscribed
                ? 'bg-green-500'
                : permission === 'denied'
                  ? 'bg-red-500'
                  : 'bg-gray-400'
            }`}
          />
          <span>
            {isSubscribed
              ? 'Push notifications enabled'
              : permission === 'denied'
                ? 'Permission denied'
                : 'Push notifications disabled'}
          </span>
        </div>
      </div>
    </div>
  )
}
