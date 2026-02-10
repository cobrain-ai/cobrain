// Publishing Error Types
// Classifies errors as retryable vs non-retryable (from OmniPost pattern)

import type { Platform } from './types.js'

/** Error codes for publishing failures */
export type PublishErrorCode =
  | 'AUTH_EXPIRED'
  | 'AUTH_REVOKED'
  | 'RATE_LIMITED'
  | 'QUOTA_EXCEEDED'
  | 'CONTENT_REJECTED'
  | 'NETWORK_ERROR'
  | 'PLATFORM_ERROR'
  | 'VALIDATION_ERROR'
  | 'NOT_INITIALIZED'

/** Publishing error with retry classification */
export class PublishError extends Error {
  readonly name = 'PublishError'

  constructor(
    public readonly code: PublishErrorCode,
    message: string,
    public readonly platform: Platform,
    public readonly retryable: boolean,
    public readonly cause?: Error
  ) {
    super(message)
  }

  static authExpired(platform: Platform, cause?: Error): PublishError {
    return new PublishError('AUTH_EXPIRED', 'Authentication token expired', platform, true, cause)
  }

  static authRevoked(platform: Platform, cause?: Error): PublishError {
    return new PublishError('AUTH_REVOKED', 'Authentication was revoked', platform, false, cause)
  }

  static rateLimited(platform: Platform, cause?: Error): PublishError {
    return new PublishError('RATE_LIMITED', 'API rate limit exceeded', platform, true, cause)
  }

  static quotaExceeded(platform: Platform, cause?: Error): PublishError {
    return new PublishError('QUOTA_EXCEEDED', 'API quota exceeded', platform, false, cause)
  }

  static contentRejected(platform: Platform, reason: string, cause?: Error): PublishError {
    return new PublishError('CONTENT_REJECTED', `Content rejected: ${reason}`, platform, false, cause)
  }

  static networkError(platform: Platform, cause?: Error): PublishError {
    return new PublishError('NETWORK_ERROR', 'Network error', platform, true, cause)
  }

  static platformError(platform: Platform, message: string, cause?: Error): PublishError {
    return new PublishError('PLATFORM_ERROR', message, platform, true, cause)
  }

  static validationError(platform: Platform, message: string): PublishError {
    return new PublishError('VALIDATION_ERROR', message, platform, false)
  }

  static notInitialized(platform: Platform): PublishError {
    return new PublishError('NOT_INITIALIZED', 'Service not initialized', platform, false)
  }
}

/** Check if an error is retryable */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof PublishError) {
    return error.retryable
  }
  // Network errors are generally retryable
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }
  return false
}
