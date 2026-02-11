'use client'

import { useState } from 'react'

interface PublishActionsProps {
  hasContent: boolean
  onSaveDraft: () => void
  onPublish: (accountId: string, platform: string, scheduledFor?: string) => void
  accounts: Array<{ id: string; platform: string; accountName: string | null }>
  isSaving: boolean
  isPublishing: boolean
}

export function PublishActions({
  hasContent,
  onSaveDraft,
  onPublish,
  accounts,
  isSaving,
  isPublishing,
}: PublishActionsProps) {
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [selectedAccount, setSelectedAccount] = useState('')

  if (!hasContent) return null

  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Actions</h3>
      </div>

      {/* Account selector */}
      {accounts.length > 0 && (
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
            Publishing Account
          </label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          >
            <option value="">Select account...</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.accountName || a.platform} ({a.platform})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Schedule option */}
      {showSchedule && (
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
            Schedule for
          </label>
          <input
            type="datetime-local"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onSaveDraft}
          disabled={isSaving}
          className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save as Draft'}
        </button>

        <button
          onClick={() => setShowSchedule(!showSchedule)}
          className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {showSchedule ? 'Cancel Schedule' : 'Schedule'}
        </button>

        {selectedAccount && (
          <button
            onClick={() => {
              const account = accounts.find((a) => a.id === selectedAccount)
              if (account) {
                onPublish(
                  selectedAccount,
                  account.platform,
                  showSchedule && scheduleDate ? new Date(scheduleDate).toISOString() : undefined
                )
              }
            }}
            disabled={isPublishing}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isPublishing ? 'Publishing...' : showSchedule && scheduleDate ? 'Schedule Publish' : 'Publish Now'}
          </button>
        )}
      </div>

      {accounts.length === 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          No publishing accounts connected.{' '}
          <a href="/composer/accounts" className="text-blue-600 dark:text-blue-400 hover:underline">
            Connect an account
          </a>{' '}
          to publish directly.
        </p>
      )}
    </div>
  )
}
