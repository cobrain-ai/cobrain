'use client'

import { useState } from 'react'

interface PlatformConfig {
  id: string
  name: string
  icon: string
  fields: Array<{
    key: string
    label: string
    type: 'text' | 'password'
    required: boolean
    placeholder?: string
  }>
}

const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    id: 'threads',
    name: 'Threads',
    icon: '🧵',
    fields: [
      { key: 'accountId', label: 'Account ID', type: 'text', required: true, placeholder: 'Your Threads user ID' },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true, placeholder: 'Long-lived access token' },
    ],
  },
  {
    id: 'hashnode',
    name: 'Hashnode',
    icon: '📝',
    fields: [
      { key: 'accessToken', label: 'API Token', type: 'password', required: true, placeholder: 'Hashnode API token' },
      { key: 'publicationId', label: 'Publication ID', type: 'text', required: false, placeholder: 'Optional publication ID' },
    ],
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    icon: '🐦',
    fields: [
      { key: 'accountId', label: 'Username', type: 'text', required: true, placeholder: '@username' },
      { key: 'accessToken', label: 'API Key', type: 'password', required: true, placeholder: 'API key' },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: true, placeholder: 'API secret' },
      { key: 'userAccessToken', label: 'Access Token', type: 'password', required: true, placeholder: 'User access token' },
      { key: 'userAccessSecret', label: 'Access Token Secret', type: 'password', required: true, placeholder: 'User access token secret' },
    ],
  },
]

interface AccountConnectModalProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (platform: string, data: Record<string, string>) => void
  isConnecting: boolean
  excludePlatforms?: string[]
}

export function AccountConnectModal({
  isOpen,
  onClose,
  onConnect,
  isConnecting,
  excludePlatforms = [],
}: AccountConnectModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})

  const availablePlatforms = PLATFORM_CONFIGS.filter((p) => !excludePlatforms.includes(p.id))
  const platformConfig = PLATFORM_CONFIGS.find((p) => p.id === selectedPlatform)

  const updateField = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  const handleConnect = () => {
    if (!selectedPlatform || !platformConfig) return

    const missingRequired = platformConfig.fields
      .filter((f) => f.required)
      .some((f) => !fields[f.key]?.trim())

    if (missingRequired) return

    onConnect(selectedPlatform, fields)
  }

  const handleClose = () => {
    setSelectedPlatform(null)
    setFields({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {selectedPlatform ? `Connect ${platformConfig?.name}` : 'Connect Account'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            &times;
          </button>
        </div>

        <div className="px-6 py-4">
          {!selectedPlatform ? (
            /* Platform selection */
            <div className="space-y-2">
              {availablePlatforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlatform(p.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="text-xl">{p.icon}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {p.name}
                  </span>
                </button>
              ))}
              {availablePlatforms.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  All supported platforms are already connected.
                </p>
              )}
            </div>
          ) : (
            /* Credential fields */
            <div className="space-y-3">
              <button
                onClick={() => {
                  setSelectedPlatform(null)
                  setFields({})
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline mb-2"
              >
                &larr; Back to platforms
              </button>

              {platformConfig?.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {field.label} {field.required && '*'}
                  </label>
                  <input
                    type={field.type}
                    value={fields[field.key] || ''}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedPlatform && (
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
