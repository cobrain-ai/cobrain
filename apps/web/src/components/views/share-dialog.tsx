'use client'

import { useState, useCallback } from 'react'
import { Share2, Copy, Check, RefreshCw, Globe, Lock, X } from 'lucide-react'

interface ShareDialogProps {
  viewId: string
  viewName: string
  isShared: boolean
  shareToken: string | null
  onClose: () => void
  onUpdate: (isShared: boolean) => void
}

export function ShareDialog({
  viewId,
  viewName,
  isShared: initialIsShared,
  shareToken: initialShareToken,
  onClose,
  onUpdate,
}: ShareDialogProps) {
  const [isShared, setIsShared] = useState(initialIsShared)
  const [shareToken, setShareToken] = useState(initialShareToken)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const shareUrl = shareToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/shared/view/${shareToken}`
    : null

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
            <div className="space-y-3">
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

              <button
                onClick={regenerateToken}
                disabled={loading}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Regenerate link
              </button>

              <p className="text-xs text-gray-500">
                Note: Regenerating the link will invalidate the current one.
              </p>
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
