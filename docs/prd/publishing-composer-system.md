# PRD: Blog/SNS Content Composer & Publishing System

**Feature**: Content composing from notes + multi-platform publishing
**Issue**: #57
**Status**: Draft (Revised - aligned with OmniPost architecture)
**Date**: 2026-02-10
**Author**: CoBrain Team
**Reference**: OmniPost (d:\srcp\omnipost) - proven multi-platform publishing SaaS

---

## 1. Problem Statement

CoBrain users capture rich knowledge in their notes—ideas, research, insights, drafts. However, there's no way to transform these notes into polished blog posts or social media content and publish them to external platforms. Users must manually:

1. Copy content from CoBrain to each platform
2. Adapt formatting/length for each service (Threads posts ≠ YouTube scripts ≠ blog articles)
3. Manage multiple platform credentials separately
4. Schedule posts across different tools (Buffer, Hootsuite, etc.)
5. Maintain consistent writing voice across platforms

OmniPost solves this as a standalone SaaS. CoBrain will bring the same capabilities **locally** as plugins, with the unique advantage of mining the user's existing knowledge base.

---

## 2. OmniPost Feature Mapping

OmniPost is a proven reference implementation. Here's how each feature translates to CoBrain:

| OmniPost Feature | OmniPost Impl | CoBrain Adaptation |
|---|---|---|
| AI Content Generation (GPT-4, Claude, Gemini) | `services/ai/` - Factory+Provider pattern | Reuse existing `packages/core/src/providers/` (Ollama, OpenAI, Anthropic, Claude CLI) |
| Platform Publishing (YouTube, Threads, Hashnode) | `services/platforms/` - Adapter pattern per platform | `packages/plugins/src/publishing/` - same adapter pattern, more platforms |
| Series Posting (Concepts → PostList → Reservations) | `routes/series.ts` + `services/queue/` | Composer plugin: Notes → Drafts → Schedule |
| Scheduling Queue (BullMQ + Redis) | `QueueProcessor` polling every 60s | Local SQLite queue + polling (no Redis dependency) |
| Token Management (OAuth refresh, encrypted storage) | `services/platforms/tokenManager.ts` | `packages/core/src/publishing/credential-store.ts` |
| Analytics (collectors, snapshots, aggregations) | `services/analytics/` + `collectors/` | Publishing analytics plugin (Phase 4) |
| Content Discovery (viral detection, recommendations) | `services/discovery/` | Composer's note mining + knowledge graph |
| Writing Style (per-series) | Series-level style config | Per-user + per-service style guides |
| Comment Management (sentiment analysis, auto-reply) | `services/ai/` sentiment prompts | Future plugin (Phase 5) |

---

## 3. Architecture Design

### 3.1 "Strong Core + Thin Adapters" (Not Democratic Plugins)

```
┌──────────────────────────────────────────────────────────┐
│                    COMPOSER PLUGIN                         │
│  Note Collector → Web Researcher → Style Engine → AI Gen  │
│  (Like OmniPost's generator.ts but sources from notes)    │
├──────────────────────────────────────────────────────────┤
│              PUBLISHING CORE LAYER (packages/core)        │
│  ┌──────────────┐ ┌───────────────┐ ┌────────────────┐  │
│  │Token Manager  │ │ Publish Queue │ │ Rate Limiter   │  │
│  │(from OmniPost │ │ (SQLite-based │ │ (per-service   │  │
│  │ tokenManager) │ │  not BullMQ)  │ │  like OmniPost)│  │
│  └──────────────┘ └───────────────┘ └────────────────┘  │
│  ┌──────────────────┐ ┌──────────────┐ ┌─────────────┐  │
│  │Content Pipeline   │ │Error Handler │ │Publisher     │  │
│  │md→html, md→text  │ │(retryable vs │ │Service       │  │
│  │thread splitter   │ │non-retryable)│ │(retry+backoff│  │
│  └──────────────────┘ └──────────────┘ └─────────────┘  │
├──────────────────────────────────────────────────────────┤
│              SERVICE ADAPTERS (thin plugins)               │
│  ┌────────┐ ┌────────┐ ┌─────────┐ ┌─────────────────┐  │
│  │Threads │ │Hashnode│ │Twitter/X│ │WordPress/Medium  │  │
│  │(proven)│ │(proven)│ │ (new)   │ │  (new)           │  │
│  └────────┘ └────────┘ └─────────┘ └─────────────────┘  │
│  ┌────────┐ ┌───────┐ ┌──────┐ ┌────────┐ ┌─────────┐  │
│  │LinkedIn│ │Bluesky│ │DevTo │ │Mastodon│ │  Ghost  │  │
│  └────────┘ └───────┘ └──────┘ └────────┘ └─────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Layer Structure

```
packages/
├── core/src/
│   └── publishing/                    # NEW: Core publishing layer
│       ├── types.ts                   # PublishingService interface, enums
│       ├── base-publisher.ts          # Abstract base (like BasePlugin)
│       ├── credential-store.ts        # Encrypted token storage (from OmniPost tokenManager)
│       ├── publish-queue.ts           # SQLite-based queue (replaces BullMQ)
│       ├── publisher-service.ts       # Publish with retry (from OmniPost PublisherService)
│       ├── content-pipeline.ts        # Markdown → platform format transforms
│       ├── rate-limiter.ts            # Per-service rate limiting
│       ├── errors.ts                  # Platform error classification (from OmniPost errors.ts)
│       └── index.ts
│
├── plugins/src/
│   ├── publishing/                    # NEW: Service adapters
│   │   ├── threads/                   # Ported from OmniPost
│   │   │   ├── adapter.ts            # PublishingService implementation
│   │   │   ├── client.ts             # Graph API client (from OmniPost)
│   │   │   └── oauth.ts              # OAuth flow (from OmniPost)
│   │   ├── hashnode/                  # Ported from OmniPost
│   │   │   ├── adapter.ts
│   │   │   └── client.ts             # GraphQL client (from OmniPost)
│   │   ├── twitter/                   # New (OmniPost had it planned)
│   │   │   ├── adapter.ts
│   │   │   ├── client.ts
│   │   │   └── oauth.ts
│   │   ├── wordpress/                 # New
│   │   ├── medium/                    # New
│   │   ├── linkedin/                  # New
│   │   ├── mastodon/                  # New
│   │   ├── bluesky/                   # New
│   │   ├── devto/                     # New
│   │   ├── ghost/                     # New
│   │   └── index.ts                   # Registry + manifests
│   │
│   └── composer/                      # NEW: AI content composer
│       ├── plugin.ts                  # CoBrain plugin integration
│       ├── note-collector.ts          # Gathers relevant notes (CoBrain-unique)
│       ├── content-generator.ts       # AI generation (from OmniPost generator.ts pattern)
│       ├── prompts.ts                 # Per-platform prompts (from OmniPost prompts.ts)
│       ├── style-engine.ts            # Writing style management (enhanced from OmniPost)
│       ├── web-researcher.ts          # Web search for enrichment (CoBrain-unique)
│       └── index.ts
│
└── database/src/schema/
    └── index.ts                       # NEW tables added
```

### 3.3 Core Publishing Types

```typescript
// packages/core/src/publishing/types.ts
// Modeled after OmniPost's platform types + CoBrain plugin system

/** Platform enum - start with OmniPost's proven 3, expand */
type Platform =
  | 'threads'    // From OmniPost (proven)
  | 'hashnode'   // From OmniPost (proven)
  | 'youtube'    // From OmniPost (proven - community posts)
  | 'twitter'    // New
  | 'wordpress'  // New
  | 'medium'     // New
  | 'linkedin'   // New
  | 'mastodon'   // New
  | 'bluesky'    // New
  | 'devto'      // New
  | 'ghost'      // New

type ServiceCategory = 'blog' | 'social' | 'developer' | 'newsletter' | 'video'

type ContentStatus = 'draft' | 'generating' | 'ready' | 'published' | 'failed'
// From OmniPost: contentStatusEnum

type PostStatus = 'queued' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'skipped'
// From OmniPost: reservationPostStatusEnum

/** Publishing service metadata */
interface PublishingServiceMeta {
  id: Platform
  name: string
  category: ServiceCategory
  icon: string
  characterLimit?: number       // 280 for tweets, 500 for Threads, etc.
  supportsMedia: boolean
  supportsThreads: boolean      // Threads: reply chains
  supportsScheduling: boolean
  authType: 'oauth2' | 'api_key'
}

/** Core publishing service interface - all adapters implement this */
interface PublishingService {
  readonly meta: PublishingServiceMeta

  // Lifecycle (modeled after OmniPost's platform adapters)
  initialize(credentials: ServiceCredentials): Promise<void>
  validateCredentials(): Promise<boolean>
  dispose(): Promise<void>

  // Publishing (modeled after OmniPost's publish functions)
  publish(content: PublishContent): Promise<PublishResult>
  update?(postId: string, content: PublishContent): Promise<PublishResult>
  delete?(postId: string): Promise<void>

  // Content adaptation (like OmniPost's per-platform content generation)
  adaptContent(raw: RawContent): Promise<AdaptedContent>
  validateContent(content: AdaptedContent): ContentValidation

  // Account info
  getAccountInfo(): Promise<AccountInfo>
}

/** Content to publish - platform-adapted */
interface PublishContent {
  title?: string
  body: string
  format: 'markdown' | 'html' | 'plaintext'
  media?: MediaAttachment[]
  tags?: string[]
  canonicalUrl?: string          // From OmniPost: cross-posting SEO
  metadata?: Record<string, unknown>
}

/** Raw content from CoBrain notes (always markdown) */
interface RawContent {
  title?: string
  body: string                   // Markdown from notes
  sourceNoteIds: string[]        // CoBrain-unique: note references
  media?: MediaAttachment[]
  tags?: string[]
}

/** Adapted for specific platform */
interface AdaptedContent extends PublishContent {
  threadParts?: string[]         // For Threads/Twitter thread splitting
  excerpt?: string               // For blog platforms needing excerpts
  seoMeta?: {                    // From OmniPost's Hashnode integration
    metaDescription?: string
    keywords?: string[]
  }
}

/** Publish result (matches OmniPost's post tracking) */
interface PublishResult {
  success: boolean
  postId?: string                // Platform's post ID
  url?: string                   // Published URL
  error?: string
  publishedAt?: Date
  platform: Platform
}

/** Content validation before publishing */
interface ContentValidation {
  valid: boolean
  errors: { field: string; message: string }[]
  warnings: { field: string; message: string }[]
  characterCount?: number
  characterLimit?: number
}
```

### 3.4 Publishing Service Error Handling

Modeled after OmniPost's `services/platforms/errors.ts`:

```typescript
// packages/core/src/publishing/errors.ts

type PublishErrorCode =
  | 'AUTH_EXPIRED'        // Token needs refresh
  | 'AUTH_REVOKED'        // User revoked access
  | 'RATE_LIMITED'        // API rate limit hit
  | 'QUOTA_EXCEEDED'      // Usage quota exceeded
  | 'CONTENT_REJECTED'    // Platform rejected content
  | 'NETWORK_ERROR'       // Connectivity issue
  | 'PLATFORM_ERROR'      // Platform API error
  | 'VALIDATION_ERROR'    // Content validation failed

class PublishError extends Error {
  constructor(
    public readonly code: PublishErrorCode,
    message: string,
    public readonly platform: Platform,
    public readonly retryable: boolean,  // From OmniPost's error classification
    public readonly cause?: Error
  ) { super(message) }
}
```

### 3.5 Publisher Service with Retry

Modeled after OmniPost's `PublisherService`:

```typescript
// packages/core/src/publishing/publisher-service.ts

class PublisherService {
  /** Publish with exponential backoff retry (from OmniPost: 1s, 2s, 4s) */
  async publishWithRetry(
    service: PublishingService,
    content: PublishContent,
    maxRetries: number = 3
  ): Promise<PublishResult>

  /** Check if error is retryable (from OmniPost's isRetryableError) */
  isRetryableError(error: PublishError): boolean

  /** Auto-pause after N consecutive failures (from OmniPost: 3) */
  shouldPause(consecutiveFailures: number): boolean
}
```

### 3.6 SQLite-Based Publish Queue

Replaces OmniPost's BullMQ+Redis with a local-first approach:

```typescript
// packages/core/src/publishing/publish-queue.ts
// Equivalent to OmniPost's PostQueueService + QueueProcessor

class PublishQueue {
  /** Add to queue (like OmniPost's initializeQueue) */
  async enqueue(post: QueuedPost): Promise<string>

  /** Get next ready post (like OmniPost's getNextPost) */
  async getNext(): Promise<QueuedPost | null>

  /** Mark as published/failed/skipped (like OmniPost's mark methods) */
  async markPublished(id: string, result: PublishResult): Promise<void>
  async markFailed(id: string, error: string): Promise<void>

  /** Process ready posts - called by scheduler */
  async processQueue(): Promise<void>

  /** Check consecutive failures for auto-pause */
  async hasConsecutiveFailures(count: number): Promise<boolean>
}
```

### 3.7 Writing Style System

Enhanced from OmniPost's per-series style config:

```typescript
// Used by composer plugin

interface WritingStyleGuide {
  id: string
  userId: string
  name: string                  // "My Professional Voice"
  isDefault: boolean

  // Global style (OmniPost has this per-series)
  tone: 'formal' | 'casual' | 'professional' | 'friendly' | 'academic' | 'custom'
  customToneDescription?: string
  language: string              // 'en', 'ko', 'ja', etc.
  targetAudience?: string
  samplePost?: string           // From OmniPost: reference sample for AI

  // Style rules
  rules: StyleRule[]

  // Per-service overrides (CoBrain enhancement over OmniPost)
  serviceOverrides: Record<Platform, Partial<WritingStyleGuide>>
}
```

### 3.8 AI Content Generation

Modeled after OmniPost's `services/ai/generator.ts`:

```typescript
// packages/plugins/src/composer/content-generator.ts

class ContentGenerator {
  /** Generate content for target platforms
   *  Like OmniPost's generator but sources from notes, not just ideas */
  async generate(input: {
    sourceNotes: Note[]           // CoBrain-unique
    targetPlatforms: Platform[]
    style: WritingStyleGuide
    enrichWithWebSearch?: boolean  // CoBrain-unique
  }): Promise<Map<Platform, AdaptedContent>>

  /** Regenerate with feedback (from OmniPost's regeneratePost) */
  async regenerate(
    content: AdaptedContent,
    feedback: string,
    style: WritingStyleGuide
  ): Promise<AdaptedContent>
}
```

### 3.9 Per-Platform Prompts

From OmniPost's `services/ai/prompts.ts` - platform-specific generation templates:

```typescript
// packages/plugins/src/composer/prompts.ts

const PLATFORM_PROMPTS: Record<Platform, string> = {
  threads: `Create 3-5 engaging Threads posts. Max 500 chars each. Use emojis...`,
  hashnode: `Write a 1500-2500 word technical blog post in Markdown...`,
  twitter: `Create a compelling Twitter thread (5-8 tweets, 280 chars each)...`,
  wordpress: `Write a comprehensive blog post with H2/H3 headings...`,
  linkedin: `Write a professional LinkedIn post (max 3000 chars)...`,
  // ... etc
}
```

### 3.10 Database Schema Extensions

New tables (inspired by OmniPost's schema, adapted for SQLite):

```sql
-- Connected publishing accounts (from OmniPost: connected_accounts)
CREATE TABLE publishing_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL,          -- 'threads', 'hashnode', 'twitter', etc.
  account_id TEXT NOT NULL,        -- Platform-specific account/user ID
  account_name TEXT,
  access_token TEXT NOT NULL,      -- Encrypted
  refresh_token TEXT,              -- Encrypted
  token_expires_at INTEGER,        -- Unix timestamp
  is_active INTEGER DEFAULT 1,
  connected_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Generated content / drafts (from OmniPost: content table)
CREATE TABLE composer_drafts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  source_note_ids TEXT,            -- JSON array of note IDs (CoBrain-unique)
  status TEXT DEFAULT 'draft',     -- draft, generating, ready, published, failed
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Per-platform content within a draft (from OmniPost: per-platform fields)
CREATE TABLE draft_content (
  id TEXT PRIMARY KEY,
  draft_id TEXT NOT NULL REFERENCES composer_drafts(id),
  platform TEXT NOT NULL,
  content TEXT NOT NULL,            -- Generated content (markdown/html/text)
  format TEXT DEFAULT 'markdown',
  metadata TEXT,                    -- JSON: tags, seoMeta, threadParts, etc.
  created_at INTEGER DEFAULT (unixepoch())
);

-- Published posts (from OmniPost: posts + reservation_posts)
CREATE TABLE published_posts (
  id TEXT PRIMARY KEY,
  draft_id TEXT REFERENCES composer_drafts(id),
  draft_content_id TEXT REFERENCES draft_content(id),
  platform TEXT NOT NULL,
  account_id TEXT REFERENCES publishing_accounts(id),
  platform_post_id TEXT,           -- Platform's own post ID
  url TEXT,                        -- Published URL
  status TEXT DEFAULT 'queued',    -- queued, scheduled, publishing, published, failed, skipped
  scheduled_for INTEGER,           -- Unix timestamp for scheduled posts
  published_at INTEGER,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Writing style guides (enhanced from OmniPost's series-level style)
CREATE TABLE writing_style_guides (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_default INTEGER DEFAULT 0,
  tone TEXT DEFAULT 'professional',
  language TEXT DEFAULT 'en',
  target_audience TEXT,
  custom_tone_description TEXT,
  sample_post TEXT,                 -- Reference sample for AI
  rules TEXT,                       -- JSON array of StyleRule
  service_overrides TEXT,           -- JSON: Record<Platform, Partial<StyleGuide>>
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Publish queue for scheduling (replaces OmniPost's BullMQ)
CREATE TABLE publish_queue (
  id TEXT PRIMARY KEY,
  published_post_id TEXT NOT NULL REFERENCES published_posts(id),
  priority INTEGER DEFAULT 0,
  scheduled_at INTEGER,             -- When to publish
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  next_retry_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);
```

---

## 4. User Stories

### US-1: Connect a Publishing Account
**As a** CoBrain user
**I want to** connect my Threads/Hashnode/Twitter account
**So that** I can publish content to those platforms

**Acceptance Criteria:**
- [ ] Settings → Publishing shows available platforms
- [ ] OAuth flow for Threads, Twitter (like OmniPost's oauth.ts)
- [ ] API key input for Hashnode, Dev.to (like OmniPost's token approach)
- [ ] Credentials encrypted locally (AES-256, like OmniPost's encrypt/decrypt)
- [ ] Token auto-refresh with 5-min buffer (from OmniPost's tokenManager)
- [ ] Connection test with account info display

### US-2: Set Up Writing Style Guide
**As a** CoBrain user
**I want to** define my writing style with per-platform overrides
**So that** AI-composed content matches my voice

**Acceptance Criteria:**
- [ ] Create/edit style guides with tone, language, audience
- [ ] Provide sample post for AI reference (from OmniPost's series style)
- [ ] Add custom rules with before/after examples
- [ ] Per-platform overrides (casual for Threads, technical for Hashnode)
- [ ] Default guide auto-applied to new compositions

### US-3: Compose Content from Notes
**As a** CoBrain user
**I want to** select notes and generate platform-specific posts
**So that** I can share my knowledge without manual rewriting

**Acceptance Criteria:**
- [ ] Select one or more notes as source material
- [ ] Choose target platform(s)
- [ ] AI generates per-platform adapted content (like OmniPost's platform-specific generation)
- [ ] Content respects writing style guide
- [ ] Optional web search enrichment
- [ ] Review/edit each platform's content before publishing
- [ ] Regenerate with feedback (from OmniPost's regeneratePost)

### US-4: Publish Immediately
**As a** CoBrain user
**I want to** publish composed content right now
**So that** I can share my work instantly

**Acceptance Criteria:**
- [ ] One-click publish to selected platforms
- [ ] Multi-platform publish with per-platform status (from OmniPost's publish flow)
- [ ] Content auto-validated per platform limits
- [ ] Success/failure per platform with error details
- [ ] Published URL stored and linkable
- [ ] Retry failed platforms (from OmniPost's retry mechanism)

### US-5: Schedule Publishing
**As a** CoBrain user
**I want to** schedule posts for future publication
**So that** I can plan my content

**Acceptance Criteria:**
- [ ] Pick date/time for each platform
- [ ] Queue view showing scheduled posts (from OmniPost's reservation model)
- [ ] Edit/cancel scheduled posts
- [ ] Auto-publish at scheduled time (local queue processor)
- [ ] Auto-pause after 3 consecutive failures (from OmniPost's QueueProcessor)

### US-6: Cross-Post with Adaptation
**As a** CoBrain user
**I want to** publish the same content across platforms with adaptation
**So that** each platform gets optimized content

**Acceptance Criteria:**
- [ ] Blog note → full article on Hashnode/WordPress
- [ ] Blog note → thread on Threads/Twitter
- [ ] Blog note → professional post on LinkedIn
- [ ] Canonical URL management (from OmniPost: blog URL as canonical)
- [ ] Each adaptation respects platform conventions

---

## 5. Technical Requirements

### 5.1 Publishing Services by Priority

| Service | Category | Auth | From OmniPost? | Priority |
|---------|----------|------|-----------------|----------|
| **Threads** | Social | OAuth2 (Graph API) | Yes - proven code | P0 |
| **Hashnode** | Developer Blog | API Key (GraphQL) | Yes - proven code | P0 |
| **Twitter/X** | Social | OAuth2 (v2 API) | Planned in OmniPost | P0 |
| **WordPress** | Blog | OAuth2/API Key (REST) | New | P1 |
| **Medium** | Blog | OAuth2 (REST) | New | P1 |
| **LinkedIn** | Social | OAuth2 (Marketing API) | New | P1 |
| **Mastodon** | Social | OAuth2 (REST) | New | P2 |
| **Bluesky** | Social | App Password (AT Protocol) | New | P2 |
| **Dev.to** | Developer | API Key (Forem REST) | New | P2 |
| **Ghost** | Blog | API Key (Admin API) | New | P2 |

### 5.2 Content Format Pipeline

```
Notes (Markdown from CoBrain)
  ↓ Note Collector (gather + merge)
  ↓ Style Engine (apply writing guide)
  ↓ AI Generator (per-platform prompts from OmniPost pattern)
  ↓
Content Pipeline
  ├── Markdown → HTML (Hashnode, WordPress, Ghost, Medium)
  ├── Markdown → Plain Text (Threads, Twitter, Mastodon, Bluesky)
  ├── Markdown → Rich Text (LinkedIn)
  ├── Long → Thread Splitter (Threads: 500 chars, Twitter: 280 chars)
  └── Long → Summary/Excerpt Generator (social teasers)
```

### 5.3 Key Patterns from OmniPost to Adopt

1. **Token Manager** - Centralized OAuth token lifecycle with auto-refresh
2. **Adapter Pattern** - Each platform: `adapter.ts` + `client.ts` + optional `oauth.ts`
3. **Error Classification** - Retryable vs non-retryable errors
4. **Exponential Backoff** - 1s → 2s → 4s retry delays (max 3 attempts)
5. **Auto-Pause** - Pause queue after 3 consecutive failures
6. **Provider Fallback** - Try multiple AI providers before failing
7. **Per-Platform Prompts** - Dedicated prompt templates per platform
8. **Content Status Machine** - draft → generating → ready → published/failed

### 5.4 Key Differences from OmniPost

| Aspect | OmniPost | CoBrain |
|--------|----------|---------|
| Database | PostgreSQL (Supabase) | SQLite (local-first) |
| Queue | BullMQ + Redis | SQLite-based queue table |
| Auth | Supabase Auth + JWT | NextAuth.js (existing) |
| AI | Standalone OpenAI/Claude clients | Existing provider system |
| Content Source | User types an "idea" | User selects notes from knowledge base |
| Deployment | Vercel + Railway (cloud) | Local app (Tauri desktop, Next.js web) |
| Plugin System | None (monolithic services) | Existing plugin architecture |

### 5.5 Security Requirements
- Credentials encrypted at rest using AES-256 (like OmniPost's crypto module)
- OAuth tokens refreshed automatically with 5-min buffer
- No credentials transmitted to external servers (local-first)
- Tauri desktop: OS keychain integration when available

---

## 6. Phase Plan

### Phase 1: Core Layer + OmniPost-Proven Platforms (MVP)
- Publishing core layer in `packages/core/src/publishing/`
  - Types, base publisher, credential store, error handling
  - Publisher service with retry logic
  - SQLite-based publish queue
- **Threads adapter** (port from OmniPost)
- **Hashnode adapter** (port from OmniPost)
- **Twitter/X adapter** (new, based on OmniPost pattern)
- Basic compose UI (manual text input, no AI yet)
- Database schema extensions
- Settings UI for connecting accounts

### Phase 2: AI Composer + Writing Styles
- Composer plugin with AI content generation
- Per-platform prompt templates (from OmniPost's prompts.ts)
- Note collector (select notes as source material)
- Writing style guides (UI + storage)
- Regenerate with feedback
- Provider fallback mechanism

### Phase 3: Scheduling + More Platforms
- Scheduling queue engine (local processor)
- Scheduled posts view
- **WordPress** adapter
- **Medium** adapter
- **LinkedIn** adapter
- Cross-posting with canonical URL management

### Phase 4: Web Research + Analytics + More Platforms
- Web search enrichment for composer
- Basic publishing analytics (from OmniPost's analytics pattern)
- **Mastodon**, **Bluesky**, **Dev.to**, **Ghost** adapters

### Phase 5: Advanced Features
- Comment management (sentiment analysis + auto-reply, from OmniPost)
- Series posting (batch content from note collections)
- Content calendar view
- A/B testing for social posts
- Template library

---

## 7. Dependencies

- Existing: Plugin system (`packages/core/src/plugins/`)
- Existing: AI provider system (`packages/core/src/providers/`)
- Existing: Notes & database (`packages/database/`)
- New: `unified`/`remark` for Markdown → HTML transformation
- Reference: OmniPost codebase at `d:\srcp\omnipost` for proven implementations

---

## 8. Success Metrics

- Notes → published post in < 2 minutes
- Content adaptation quality: >80% user satisfaction
- Publishing reliability: >99% success rate (with retry)
- Initial launch: 3 platforms (Threads, Hashnode, Twitter)
- 6-month goal: 10+ platforms

---

## 9. Risks & Mitigations

| Risk | Mitigation | OmniPost Reference |
|------|-----------|-------------------|
| API rate limits | Rate limiter + exponential backoff | `PublisherService.publishWithRetry()` |
| OAuth token expiry | Auto-refresh with 5-min buffer | `tokenManager.ts` |
| Platform API changes | Adapter pattern isolates changes | `services/platforms/` structure |
| AI content quality | User review + style guides + regenerate | `regeneratePost` pattern |
| Offline scheduling | SQLite queue with retry on reconnect | Replaces BullMQ approach |
| Consecutive failures | Auto-pause after 3 failures | `QueueProcessor.hasConsecutiveFailures()` |
