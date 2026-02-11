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
  | 'TOKEN_REFRESH_FAILED'
  | 'SESSION_EXPIRED'
  | 'INVALID_API_KEY'
  | 'CONTENT_TOO_LONG'
  | 'DUPLICATE_CONTENT'
  | 'ACCOUNT_SUSPENDED'

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

  static tokenRefreshFailed(platform: Platform, reason: string, cause?: Error): PublishError {
    return new PublishError('TOKEN_REFRESH_FAILED', `Token refresh failed: ${reason}`, platform, false, cause)
  }

  static sessionExpired(platform: Platform, cause?: Error): PublishError {
    return new PublishError('SESSION_EXPIRED', 'Session has expired', platform, true, cause)
  }

  static invalidApiKey(platform: Platform, cause?: Error): PublishError {
    return new PublishError('INVALID_API_KEY', 'API key is invalid or revoked', platform, false, cause)
  }

  static contentTooLong(platform: Platform, limit: number, actual: number): PublishError {
    return new PublishError('CONTENT_TOO_LONG', `Content is ${actual} chars, limit is ${limit}`, platform, false)
  }

  static duplicateContent(platform: Platform, cause?: Error): PublishError {
    return new PublishError('DUPLICATE_CONTENT', 'This content has already been published', platform, false, cause)
  }

  static accountSuspended(platform: Platform, cause?: Error): PublishError {
    return new PublishError('ACCOUNT_SUSPENDED', 'Account has been suspended', platform, false, cause)
  }
}

/** Map error codes to user-friendly messages */
const USER_FRIENDLY_MESSAGES: Record<PublishErrorCode, string> = {
  AUTH_EXPIRED: 'Your login has expired. Please reconnect your account.',
  AUTH_REVOKED: 'Your account access was revoked. Please reconnect your account.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  QUOTA_EXCEEDED: 'You have reached the platform API limit. Please try again later.',
  CONTENT_REJECTED: 'The platform rejected your content. Please review and try again.',
  NETWORK_ERROR: 'A network error occurred. Please check your connection and try again.',
  PLATFORM_ERROR: 'The platform encountered an error. Please try again later.',
  VALIDATION_ERROR: 'Your content has validation errors. Please review and fix them.',
  NOT_INITIALIZED: 'The publishing service is not ready. Please try again.',
  TOKEN_REFRESH_FAILED: 'Could not refresh your login. Please reconnect your account.',
  SESSION_EXPIRED: 'Your session has expired. Please reconnect your account.',
  INVALID_API_KEY: 'Your API key is invalid or has been revoked. Please update it in settings.',
  CONTENT_TOO_LONG: 'Your content exceeds the platform character limit. Please shorten it.',
  DUPLICATE_CONTENT: 'This content has already been published to this platform.',
  ACCOUNT_SUSPENDED: 'Your account has been suspended by the platform. Please check your account status.',
}

/** Get a user-friendly message for a publishing error */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof PublishError) {
    return USER_FRIENDLY_MESSAGES[error.code] ?? error.message
  }
  return 'An unexpected error occurred. Please try again.'
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
