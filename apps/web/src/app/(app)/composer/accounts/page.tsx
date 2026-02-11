'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { AccountCard } from '@/components/composer/AccountCard'

interface Account {
  id: string
  platform: string
  accountId: string
  accountName: string | null
  isActive: boolean
  connectedAt: string
  hasToken: boolean
}

const PLATFORMS = [
  { id: 'threads', label: 'Threads', icon: '🧵', fields: ['accessToken'] },
  { id: 'twitter', label: 'Twitter/X', icon: '🐦', fields: ['apiKey', 'apiSecret', 'accessToken', 'accessTokenSecret'] },
  { id: 'hashnode', label: 'Hashnode', icon: '📝', fields: ['accessToken', 'publicationId'] },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', fields: ['accessToken'] },
  { id: 'mastodon', label: 'Mastodon', icon: '🐘', fields: ['accessToken', 'instanceUrl'] },
  { id: 'bluesky', label: 'Bluesky', icon: '🦋', fields: ['accessToken', 'handle'] },
  { id: 'devto', label: 'Dev.to', icon: '👩‍💻', fields: ['accessToken'] },
  { id: 'medium', label: 'Medium', icon: '📰', fields: ['accessToken'] },
  { id: 'wordpress', label: 'WordPress', icon: '🌐', fields: ['accessToken', 'siteUrl'] },
  { id: 'ghost', label: 'Ghost', icon: '👻', fields: ['accessToken', 'siteUrl'] },
] as const

const FIELD_LABELS: Record<string, string> = {
  accessToken: 'Access Token / API Key',
  apiKey: 'API Key',
  apiSecret: 'API Secret',
  accessTokenSecret: 'Access Token Secret',
  publicationId: 'Publication ID',
  instanceUrl: 'Instance URL',
  handle: 'Handle',
  siteUrl: 'Site URL',
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null)
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null)
  const [formFields, setFormFields] = useState<Record<string, string>>({})
  const [accountName, setAccountName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/publishing/accounts')
      if (res.ok) {
        const data = await res.json()
        setAccounts(data.accounts)
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const handleConnect = async (platformId: string) => {
    setError(null)
    const accessToken = formFields.accessToken
    if (!accessToken?.trim()) {
      setError('Access token is required')
      return
    }

    try {
      const metadata: Record<string, string> = {}
      const platform = PLATFORMS.find((p) => p.id === platformId)
      if (platform) {
        for (const field of platform.fields) {
          if (field !== 'accessToken' && formFields[field]) {
            metadata[field] = formFields[field]
          }
        }
      }

      const res = await fetch('/api/publishing/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platformId,
          accountId: accountName || platformId,
          accountName: accountName || undefined,
          accessToken,
          metadata,
        }),
      })

      if (res.ok) {
        setConnectingPlatform(null)
        setFormFields({})
        setAccountName('')
        fetchAccounts()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to connect')
      }
    } catch {
      setError('Failed to connect account')
    }
  }

  const handleDisconnect = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return
    setDisconnectingId(id)
    try {
      const res = await fetch(`/api/publishing/accounts?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchAccounts()
      }
    } catch {
      // ignore
    } finally {
      setDisconnectingId(null)
    }
  }

  const connectedPlatformIds = new Set(accounts.map((a) => a.platform))

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Link
            href="/composer"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            &larr; Composer
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Publishing Accounts
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Connect your blogging and social media accounts to publish directly
        </p>
      </div>

      {/* Connected accounts */}
      {accounts.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Connected ({accounts.length})
          </h2>
          <div className="space-y-2">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onDisconnect={handleDisconnect}
                isDisconnecting={disconnectingId === account.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Available platforms */}
      <section>
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Available Platforms
        </h2>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PLATFORMS.map((platform) => {
              const isConnected = connectedPlatformIds.has(platform.id)
              const isExpanded = connectingPlatform === platform.id

              return (
                <div
                  key={platform.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{platform.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {platform.label}
                        </p>
                        {isConnected && (
                          <p className="text-xs text-green-600 dark:text-green-400">Connected</p>
                        )}
                      </div>
                    </div>
                    {!isConnected && (
                      <button
                        onClick={() => {
                          if (isExpanded) {
                            setConnectingPlatform(null)
                            setFormFields({})
                            setAccountName('')
                            setError(null)
                          } else {
                            setConnectingPlatform(platform.id)
                            setFormFields({})
                            setAccountName('')
                            setError(null)
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {isExpanded ? 'Cancel' : 'Connect'}
                      </button>
                    )}
                  </div>

                  {/* Connect form */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                      {error && (
                        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                      )}

                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Account Name (optional)
                        </label>
                        <input
                          type="text"
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          placeholder={`My ${platform.label} account`}
                          className="w-full px-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {platform.fields.map((field) => (
                        <div key={field}>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {FIELD_LABELS[field] || field} *
                          </label>
                          <input
                            type={field.toLowerCase().includes('token') || field.toLowerCase().includes('secret') || field.toLowerCase().includes('key') ? 'password' : 'text'}
                            value={formFields[field] || ''}
                            onChange={(e) =>
                              setFormFields((prev) => ({ ...prev, [field]: e.target.value }))
                            }
                            placeholder={FIELD_LABELS[field] || field}
                            className="w-full px-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      ))}

                      <button
                        onClick={() => handleConnect(platform.id)}
                        className="w-full py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Connect {platform.label}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
