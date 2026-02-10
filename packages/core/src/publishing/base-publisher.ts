// Base Publisher
// Abstract base class for platform adapters (like BasePlugin for plugins)

import type {
  PublishingService,
  PublishingServiceMeta,
  ServiceCredentials,
  PublishContent,
  PublishResult,
  RawContent,
  AdaptedContent,
  ContentValidation,
  AccountInfo,
} from './types.js'
import { PublishError } from './errors.js'

/**
 * Abstract base class for publishing service adapters.
 * Provides common functionality - platform-specific logic in subclasses.
 */
export abstract class BasePublisher implements PublishingService {
  abstract readonly meta: PublishingServiceMeta

  protected credentials?: ServiceCredentials
  protected initialized = false

  async initialize(credentials: ServiceCredentials): Promise<void> {
    this.credentials = credentials
    this.initialized = true
  }

  async dispose(): Promise<void> {
    this.credentials = undefined
    this.initialized = false
  }

  protected ensureInitialized(): void {
    if (!this.initialized || !this.credentials) {
      throw PublishError.notInitialized(this.meta.id)
    }
  }

  abstract validateCredentials(): Promise<boolean>
  abstract publish(content: PublishContent): Promise<PublishResult>
  abstract adaptContent(raw: RawContent): Promise<AdaptedContent>
  abstract getAccountInfo(): Promise<AccountInfo>

  validateContent(content: AdaptedContent): ContentValidation {
    const errors: { field: string; message: string }[] = []
    const warnings: { field: string; message: string }[] = []

    if (!content.body || content.body.trim().length === 0) {
      errors.push({ field: 'body', message: 'Content body is required' })
    }

    const charLimit = this.meta.characterLimit
    if (charLimit && content.body.length > charLimit) {
      errors.push({
        field: 'body',
        message: `Content exceeds ${charLimit} character limit (${content.body.length} chars)`,
      })
    }

    if (charLimit && content.body.length > charLimit * 0.9) {
      warnings.push({
        field: 'body',
        message: `Content is near the ${charLimit} character limit`,
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      characterCount: content.body.length,
      characterLimit: charLimit,
    }
  }
}
