'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Share2,
  Copy,
  Check,
  RefreshCw,
  Globe,
  Lock,
  X,
  Shield,
  Calendar,
  BarChart3,
  Eye,
  EyeOff,
} from 'lucide-react'

interface ShareAnalytics {
  totalViews: number
  uniqueVisitors: number
  viewsByDay: { date: string; count: number }[]
  topReferrers: { referrer: string; count: number }[]
  topCountries: { country: string; count: number }[]
}

interface ShareDialogProps {
  viewId: string
  viewName: string
  isShared: boolean
  shareToken: string | null
  sharePassword?: string | null
  shareExpiresAt?: Date | null
  onClose: () => void
  onUpdate: (isShared: boolean) => void
}

export function ShareDialog({
  viewId,
  viewName,
  isShared: initialIsShared,
  shareToken: initialShareToken,
  sharePassword: initialSharePassword,
  shareExpiresAt: initialShareExpiresAt,
  onClose,
  onUpdate,
}: ShareDialogProps) {
  const [isShared, setIsShared] = useState(initialIsShared)
  const [shareToken, setShareToken] = useState(initialShareToken)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  // Password protection
  const [passwordEnabled, setPasswordEnabled] = useState(!!initialSharePassword)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Expiration
  const [expirationEnabled, setExpirationEnabled] = useState(!!initialShareExpiresAt)
  const [expiresAt, setExpiresAt] = useState<string>(
    initialShareExpiresAt
      ? new Date(initialShareExpiresAt).toISOString().split('T')[0]
      : ''
  )

  // Analytics
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [analytics, setAnalytics] = useState<ShareAnalytics | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)

  const shareUrl = shareToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/shared/view/${shareToken}`
    : null

  // Fetch analytics when toggled
  useEffect(() => {
    if (showAnalytics && !analytics && !loadingAnalytics) {
      fetchAnalytics()
    }
  }, [showAnalytics])

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true)
    try {
      const response = await fetch(`/api/views/analytics?id=${viewId}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  const toggleSharing = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/views?id=${viewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isShared: !isShared }),
      })

      if (response.ok) {
        const { view } = await response.json()
        setIsShared(view.isShared)
        setShareToken(view.shareToken)
        onUpdate(view.isShared)
      }
    } catch (error) {
      console.error('Failed to update sharing:', error)
    } finally {
      setLoading(false)
    }
  }, [viewId, isShared, onUpdate])

  const updateShareSettings = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/views?id=${viewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sharePassword: passwordEnabled ? password : null,
          shareExpiresAt: expirationEnabled && expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      })

      if (response.ok) {
        // Settings updated successfully
      }
    } catch (error) {
      console.error('Failed to update share settings:', error)
    } finally {
      setLoading(false)
    }
  }, [viewId, passwordEnabled, password, expirationEnabled, expiresAt])

  const regenerateToken = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/views?id=${viewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerateToken' }),
      })

      if (response.ok) {
        const { shareToken: newToken } = await response.json()
        setShareToken(newToken)
      }
    } catch (error) {
      console.error('Failed to regenerate token:', error)
    } finally {
      setLoading(false)
    }
  }, [viewId])

  const copyToClipboard = useCallback(async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
      }
    }
  }, [shareUrl])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-500" />
            <h2 className="font-semibold">Share View</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Share &quot;{viewName}&quot; with anyone using a public link.
          </p>

          {/* Sharing toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
            <div className="flex items-center gap-3">
              {isShared ? (
                <Globe className="h-5 w-5 text-green-500" />
              ) : (
                <Lock className="h-5 w-5 text-gray-500" />
              )}
              <div>
                <p className="font-medium text-sm">
                  {isShared ? 'Public' : 'Private'}
                </p>
                <p className="text-xs text-gray-500">
                  {isShared
                    ? 'Anyone with the link can view'
                    : 'Only you can access this view'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleSharing}
              disabled={loading}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isShared ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              } ${loading ? 'opacity-50' : ''}`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  isShared ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Share URL */}
          {isShared && shareUrl && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span className="text-sm">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span className="text-sm">Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Password Protection */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Password Protection</span>
                  </div>
                  <button
                    onClick={() => setPasswordEnabled(!passwordEnabled)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      passwordEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        passwordEnabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                {passwordEnabled && (
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full px-3 py-2 pr-10 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Expiration Date */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Expiration Date</span>
                  </div>
                  <button
                    onClick={() => setExpirationEnabled(!expirationEnabled)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      expirationEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        expirationEnabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                {expirationEnabled && (
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
                  />
                )}
              </div>

              {/* Save Settings Button */}
              {(passwordEnabled || expirationEnabled) && (
                <button
                  onClick={updateShareSettings}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </button>
              )}

              {/* Analytics Toggle */}
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <BarChart3 className="h-4 w-4" />
                {showAnalytics ? 'Hide Analytics' : 'View Analytics'}
              </button>

              {/* Analytics Panel */}
              {showAnalytics && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                  {loadingAnalytics ? (
                    <div className="text-sm text-gray-500 text-center py-4">
                      Loading analytics...
                    </div>
                  ) : analytics ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-2 bg-white dark:bg-gray-900 rounded-lg">
                          <p className="text-2xl font-bold text-blue-500">{analytics.totalViews}</p>
                          <p className="text-xs text-gray-500">Total Views</p>
                        </div>
                        <div className="text-center p-2 bg-white dark:bg-gray-900 rounded-lg">
                          <p className="text-2xl font-bold text-green-500">{analytics.uniqueVisitors}</p>
                          <p className="text-xs text-gray-500">Unique Visitors</p>
                        </div>
                      </div>
                      {analytics.topReferrers.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Top Referrers</p>
                          {analytics.topReferrers.slice(0, 3).map((r, i) => (
                            <div key={i} className="flex justify-between text-xs">
                              <span className="truncate">{r.referrer || 'Direct'}</span>
                              <span className="text-gray-500">{r.count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 text-center">No analytics data yet</p>
                  )}
                </div>
              )}

              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={regenerateToken}
                  disabled={loading}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Regenerate link
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  This will invalidate the current link.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
