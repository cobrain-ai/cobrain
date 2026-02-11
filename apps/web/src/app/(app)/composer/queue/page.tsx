'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface PublishedPost {
  id: string
  platform: string
  status: string
  scheduledFor: string | null
  publishedAt: string | null
  error: string | null
  retryCount: number
  url: string | null
  createdAt: string
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  queued: {
    label: 'Queued',
    className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  },
  scheduled: {
    label: 'Scheduled',
    className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  },
  publishing: {
    label: 'Publishing',
    className: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  },
  published: {
    label: 'Published',
    className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  },
  skipped: {
    label: 'Skipped',
    className: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  },
}

const PLATFORM_ICONS: Record<string, string> = {
  threads: '🧵',
  twitter: '🐦',
  hashnode: '📝',
  linkedin: '💼',
  mastodon: '🐘',
  bluesky: '🦋',
  devto: '👩‍💻',
  medium: '📰',
  wordpress: '🌐',
  ghost: '👻',
}

function formatTimeUntil(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff <= 0) return 'now'
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  if (hours > 0) return `in ${hours}h ${mins % 60}m`
  return `in ${mins}m`
}

export default function QueuePage() {
  const [posts, setPosts] = useState<PublishedPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processResult, setProcessResult] = useState<string | null>(null)

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/publishing/queue')
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts)
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleProcessNow = async () => {
    setIsProcessing(true)
    setProcessResult(null)

    try {
      const res = await fetch('/api/publishing/process-queue', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        const { stats } = data
        setProcessResult(
          `Processed ${stats.processed}: ${stats.succeeded} succeeded, ${stats.failed} failed, ${stats.skipped} skipped`
        )
        fetchPosts()
      }
    } catch {
      setProcessResult('Failed to process queue')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRetry = async (postId: string) => {
    try {
      const res = await fetch('/api/publishing/queue/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      })
      if (res.ok) {
        fetchPosts()
      }
    } catch {
      // ignore
    }
  }

  const activeCount = posts.filter((p) => ['queued', 'scheduled', 'publishing'].includes(p.status)).length
  const failedCount = posts.filter((p) => p.status === 'failed').length

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Publish Queue
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track and manage your publishing jobs
            </p>
          </div>
          <button
            onClick={handleProcessNow}
            disabled={isProcessing}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Process Now'}
          </button>
        </div>
      </div>

      {/* Process result */}
      {processResult && (
        <div className="mb-4 p-3 rounded-lg text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          {processResult}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{posts.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Posts</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 text-center">
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{activeCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">In Queue</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 text-center">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{failedCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Failed</p>
        </div>
      </div>

      {/* Post list */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading queue...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
          <p className="text-xl mb-2">📮</p>
          <p className="text-gray-600 dark:text-gray-400 mb-3">No publishing jobs yet</p>
          <Link
            href="/composer"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Create content in Composer
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => {
            const badge = STATUS_BADGES[post.status] ?? STATUS_BADGES.queued
            const icon = PLATFORM_ICONS[post.platform] ?? '📄'

            return (
              <div
                key={post.id}
                className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                          {post.platform}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-0.5">
                        {post.scheduledFor && post.status === 'scheduled' && (
                          <span className="text-xs text-blue-500 dark:text-blue-400">
                            {formatTimeUntil(post.scheduledFor)}
                          </span>
                        )}
                        {post.publishedAt && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Published {new Date(post.publishedAt).toLocaleString()}
                          </span>
                        )}
                        {post.retryCount > 0 && (
                          <span className="text-xs text-orange-500">
                            {post.retryCount} retries
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          Created {new Date(post.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {post.error && (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                          {post.error}
                        </p>
                      )}
                      {post.url && (
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
                        >
                          View post
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {post.status === 'failed' && (
                      <button
                        onClick={() => handleRetry(post.id)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
