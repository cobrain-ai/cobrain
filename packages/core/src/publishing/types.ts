// Publishing System Core Types
// Strong core layer for multi-platform content publishing

/** Supported publishing platforms */
export type Platform =
  | 'threads'
  | 'hashnode'
  | 'twitter'
  | 'wordpress'
  | 'medium'
  | 'linkedin'
  | 'mastodon'
  | 'bluesky'
  | 'devto'
  | 'ghost'

/** Platform service categories */
export type ServiceCategory = 'blog' | 'social' | 'developer' | 'newsletter' | 'video'

/** Content lifecycle status */
export type ContentStatus = 'draft' | 'generating' | 'ready' | 'published' | 'failed'

/** Post publishing status */
export type PostStatus = 'queued' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'skipped'

/** Authentication type for platform connection */
export type AuthType = 'oauth2' | 'api_key'

/** Publishing service metadata */
export interface PublishingServiceMeta {
  id: Platform
  name: string
  category: ServiceCategory
  icon: string
  characterLimit?: number
  supportsMedia: boolean
  supportsThreads: boolean
  supportsScheduling: boolean
  authType: AuthType
  oauthScopes?: string[]
}

/** Stored credentials for a connected platform account */
export interface ServiceCredentials {
  platform: Platform
  accountId: string
  accountName?: string
  accessToken: string
  refreshToken?: string
  tokenExpiresAt?: number
  metadata?: Record<string, unknown>
}

/** Account info returned from platform */
export interface AccountInfo {
  id: string
  name: string
  username?: string
  avatarUrl?: string
  profileUrl?: string
}

/** Media attachment for publishing */
export interface MediaAttachment {
  type: 'image' | 'video' | 'gif'
  url?: string
  data?: Buffer | Blob
  mimeType: string
  altText?: string
}

/** Raw content from CoBrain notes (always markdown) */
export interface RawContent {
  title?: string
  body: string
  sourceNoteIds?: string[]
  media?: MediaAttachment[]
  tags?: string[]
}

/** Content ready for publishing to a specific platform */
export interface PublishContent {
  title?: string
  body: string
  format: 'markdown' | 'html' | 'plaintext'
  media?: MediaAttachment[]
  tags?: string[]
  canonicalUrl?: string
  metadata?: Record<string, unknown>
}

/** Platform-adapted content with extra fields */
export interface AdaptedContent extends PublishContent {
  threadParts?: string[]
  excerpt?: string
  seoMeta?: {
    metaDescription?: string
    keywords?: string[]
  }
}

/** Result of a publish operation */
export interface PublishResult {
  success: boolean
  platform: Platform
  postId?: string
  url?: string
  error?: string
  publishedAt?: Date
}

/** Content validation result */
export interface ContentValidation {
  valid: boolean
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
  characterCount?: number
  characterLimit?: number
}

export interface ValidationIssue {
  field: string
  message: string
}

/** Core publishing service interface - all platform adapters implement this */
export interface PublishingService {
  readonly meta: PublishingServiceMeta

  initialize(credentials: ServiceCredentials): Promise<void>
  validateCredentials(): Promise<boolean>
  dispose(): Promise<void>

  publish(content: PublishContent): Promise<PublishResult>
  update?(postId: string, content: PublishContent): Promise<PublishResult>
  delete?(postId: string): Promise<void>

  adaptContent(raw: RawContent): Promise<AdaptedContent>
  validateContent(content: AdaptedContent): ContentValidation

  getAccountInfo(): Promise<AccountInfo>
}

/** OAuth configuration for platforms that use OAuth */
export interface OAuthConfig {
  authorizationUrl: string
  tokenUrl: string
  clientId: string
  clientSecret: string
  scopes: string[]
  redirectUri: string
}

/** OAuth token response */
export interface OAuthTokenResponse {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
  tokenType: string
  scope?: string
}

/** Writing style guide for AI content generation */
export interface WritingStyleGuide {
  id: string
  userId: string
  name: string
  isDefault: boolean
  tone: 'formal' | 'casual' | 'professional' | 'friendly' | 'academic' | 'custom'
  customToneDescription?: string
  language: string
  targetAudience?: string
  samplePost?: string
  rules: StyleRule[]
  serviceOverrides: Partial<Record<Platform, Partial<WritingStyleGuide>>>
}

export interface StyleRule {
  type: 'avoid' | 'prefer' | 'require' | 'custom'
  description: string
  examples?: { before: string; after: string }[]
}

/** Queued post for scheduling */
export interface QueuedPost {
  id: string
  publishedPostId: string
  platform: Platform
  accountId: string
  content: PublishContent
  scheduledAt?: number
  priority: number
  attempts: number
  maxAttempts: number
  lastError?: string
  nextRetryAt?: number
}

/** Publishing service registry entry */
export interface PublishingServiceEntry {
  meta: PublishingServiceMeta
  factory: () => PublishingService
}
