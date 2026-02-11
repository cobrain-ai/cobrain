'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface QueueStats {
  processed: number
  succeeded: number
  failed: number
  skipped: number
}

interface QueueProcessorState {
  isProcessing: boolean
  lastResult: QueueStats | null
  error: string | null
}

const POLL_INTERVAL = 30000 // 30 seconds

/**
 * Background hook that polls POST /api/publishing/process-queue
 * every 30 seconds to process pending publish jobs.
 * Follows the same pattern as NotificationProvider polling.
 */
export function useQueueProcessor(): QueueProcessorState {
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastResult, setLastResult] = useState<QueueStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const processQueue = useCallback(async () => {
    if (isProcessing) return

    setIsProcessing(true)
    setError(null)

    try {
      const res = await fetch('/api/publishing/process-queue', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setLastResult(data.stats)
      } else if (res.status !== 401) {
        // 401 means not logged in — silently skip
        setError('Queue processing failed')
      }
    } catch {
      // Network error — silently skip, will retry next interval
    } finally {
      setIsProcessing(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Initial process on mount
    processQueue()

    // Set up polling interval
    intervalRef.current = setInterval(processQueue, POLL_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [processQueue])

  return { isProcessing, lastResult, error }
}
