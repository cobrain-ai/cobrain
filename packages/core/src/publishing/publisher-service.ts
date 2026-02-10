// Publisher Service
// Handles publishing with retry logic and error classification
// Modeled after OmniPost's PublisherService

import type { PublishingService, PublishContent, PublishResult, Platform } from './types.js'
import { isRetryableError } from './errors.js'

/** Retry configuration */
export interface RetryConfig {
  maxAttempts: number
  baseDelayMs: number
  maxDelayMs: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
}

/**
 * PublisherService handles publishing with exponential backoff retry.
 * From OmniPost: 1s -> 2s -> 4s delays, max 3 attempts.
 */
export class PublisherService {
  private readonly config: RetryConfig

  constructor(config?: Partial<RetryConfig>) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config }
  }

  /**
   * Publish content with automatic retry on retryable errors.
   */
  async publishWithRetry(
    service: PublishingService,
    content: PublishContent,
  ): Promise<PublishResult> {
    let lastError: Error | undefined

    for (let attempt = 0; attempt < this.config.maxAttempts; attempt++) {
      try {
        const result = await service.publish(content)
        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (!isRetryableError(error) || attempt === this.config.maxAttempts - 1) {
          return {
            success: false,
            platform: service.meta.id,
            error: lastError.message,
          }
        }

        // Exponential backoff: 1s, 2s, 4s, ...
        const delay = Math.min(
          this.config.baseDelayMs * Math.pow(2, attempt),
          this.config.maxDelayMs
        )
        await this.sleep(delay)
      }
    }

    return {
      success: false,
      platform: service.meta.id,
      error: lastError?.message ?? 'Max retries exceeded',
    }
  }

  /**
   * Publish to multiple platforms concurrently.
   */
  async publishToMultiple(
    services: Map<Platform, { service: PublishingService; content: PublishContent }>,
  ): Promise<Map<Platform, PublishResult>> {
    const results = new Map<Platform, PublishResult>()
    const promises = Array.from(services.entries()).map(
      async ([platform, { service, content }]) => {
        const result = await this.publishWithRetry(service, content)
        results.set(platform, result)
      }
    )
    await Promise.allSettled(promises)
    return results
  }

  /**
   * Check if queue should be paused after consecutive failures.
   * From OmniPost: pause after 3 consecutive failures.
   */
  shouldPause(consecutiveFailures: number, threshold: number = 3): boolean {
    return consecutiveFailures >= threshold
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
