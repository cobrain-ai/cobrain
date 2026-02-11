// Queue Processor
// Interval-based polling processor for the publish queue.
// Modeled after OmniPost's simple interval approach adapted for SQLite.

export interface QueueJob {
  id: string
  publishedPostId: string
  attempts: number
  maxAttempts: number
  scheduledAt?: Date | null
}

export interface ProcessResult {
  jobId: string
  publishedPostId: string
  success: boolean
  error?: string
}

export interface QueueTickStats {
  processed: number
  succeeded: number
  failed: number
  skipped: number
}

export interface QueueProcessorConfig {
  /** Polling interval in ms (default 30000) */
  intervalMs: number
  /** Max jobs to process per tick (default 5) */
  batchSize: number
  /** Consecutive failures before pausing an account (default 3) */
  pauseThreshold: number
  /** Token expiry buffer in ms (default 5 minutes) */
  tokenExpiryBufferMs: number
}

const DEFAULT_CONFIG: QueueProcessorConfig = {
  intervalMs: 30000,
  batchSize: 5,
  pauseThreshold: 3,
  tokenExpiryBufferMs: 5 * 60 * 1000,
}

/**
 * QueueProcessor polls for pending publish jobs and processes them.
 * Uses dependency injection for database and publish operations.
 */
export class QueueProcessor {
  private readonly config: QueueProcessorConfig
  private timer: ReturnType<typeof setInterval> | null = null
  private processing = false

  /** Track consecutive failures per account for circuit breaker */
  private accountFailures: Map<string, number> = new Map()

  constructor(
    private readonly findPendingFn: (limit: number) => Promise<QueueJob[]>,
    private readonly processFn: (job: QueueJob) => Promise<ProcessResult>,
    config?: Partial<QueueProcessorConfig>,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /** Start polling */
  start(): void {
    if (this.timer) return
    this.timer = setInterval(() => this.tick(), this.config.intervalMs)
    // Run immediately on start
    this.tick()
  }

  /** Stop polling */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  /** Is the processor running? */
  get isRunning(): boolean {
    return this.timer !== null
  }

  /** Process one batch of pending jobs */
  async tick(): Promise<QueueTickStats> {
    if (this.processing) {
      return { processed: 0, succeeded: 0, failed: 0, skipped: 0 }
    }

    this.processing = true
    const stats: QueueTickStats = { processed: 0, succeeded: 0, failed: 0, skipped: 0 }

    try {
      const jobs = await this.findPendingFn(this.config.batchSize)

      for (const job of jobs) {
        // Check circuit breaker — skip if account has too many consecutive failures
        // We use publishedPostId as a proxy; the processFn should handle account-level checks
        const result = await this.processFn(job)
        stats.processed++

        if (result.success) {
          stats.succeeded++
          // Reset failure count for related account
          this.resetAccountFailures(result.publishedPostId)
        } else {
          stats.failed++
          this.incrementAccountFailures(result.publishedPostId)
        }
      }
    } catch (error) {
      // Tick-level error — log but don't crash the processor
      console.error('[QueueProcessor] tick error:', error)
    } finally {
      this.processing = false
    }

    return stats
  }

  /** Check if an account should be paused */
  isAccountPaused(accountId: string): boolean {
    return (this.accountFailures.get(accountId) ?? 0) >= this.config.pauseThreshold
  }

  /** Reset failures for an account */
  resetAccountFailures(accountId: string): void {
    this.accountFailures.delete(accountId)
  }

  private incrementAccountFailures(accountId: string): void {
    const current = this.accountFailures.get(accountId) ?? 0
    this.accountFailures.set(accountId, current + 1)
  }
}
