import { eq, desc, and, sql } from 'drizzle-orm'
import {
  getDatabase,
  generateId,
  publishingAccounts,
  composerDrafts,
  draftContent,
  publishedPosts,
  writingStyleGuides,
  publishQueue,
} from '../client.js'
import type {
  PublishingPlatform,
  PublishingContentStatus,
  PublishingPostStatus,
} from '../schema/index.js'

// ============================================
// Publishing Accounts
// ============================================

export interface CreatePublishingAccountInput {
  userId: string
  platform: PublishingPlatform
  accountId: string
  accountName?: string
  accessToken: string
  refreshToken?: string
  tokenExpiresAt?: number
  metadata?: Record<string, unknown>
}

export const publishingAccountsRepository = {
  async create(input: CreatePublishingAccountInput) {
    const db = getDatabase()
    const id = generateId()
    const now = new Date()

    await db.insert(publishingAccounts).values({
      id,
      userId: input.userId,
      platform: input.platform,
      accountId: input.accountId,
      accountName: input.accountName,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      tokenExpiresAt: input.tokenExpiresAt,
      metadata: input.metadata ?? {},
      connectedAt: now,
      updatedAt: now,
    })

    return db.select().from(publishingAccounts).where(eq(publishingAccounts.id, id)).get()!
  },

  async findByUser(userId: string) {
    const db = getDatabase()
    return db
      .select()
      .from(publishingAccounts)
      .where(and(eq(publishingAccounts.userId, userId), eq(publishingAccounts.isActive, true)))
      .orderBy(desc(publishingAccounts.connectedAt))
  },

  async findByUserAndPlatform(userId: string, platform: PublishingPlatform) {
    const db = getDatabase()
    return db
      .select()
      .from(publishingAccounts)
      .where(
        and(
          eq(publishingAccounts.userId, userId),
          eq(publishingAccounts.platform, platform),
          eq(publishingAccounts.isActive, true)
        )
      )
  },

  async findById(id: string) {
    const db = getDatabase()
    return db.select().from(publishingAccounts).where(eq(publishingAccounts.id, id)).get() ?? null
  },

  async update(id: string, updates: Partial<CreatePublishingAccountInput & { isActive: boolean }>) {
    const db = getDatabase()
    await db
      .update(publishingAccounts)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(eq(publishingAccounts.id, id))
    return db.select().from(publishingAccounts).where(eq(publishingAccounts.id, id)).get()!
  },

  async disconnect(id: string) {
    const db = getDatabase()
    await db
      .update(publishingAccounts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(publishingAccounts.id, id))
  },

  async delete(id: string) {
    const db = getDatabase()
    await db.delete(publishingAccounts).where(eq(publishingAccounts.id, id))
  },
}

// ============================================
// Composer Drafts
// ============================================

export interface CreateDraftInput {
  userId: string
  title?: string
  sourceNoteIds?: string[]
}

export interface UpdateDraftInput {
  title?: string
  sourceNoteIds?: string[]
  status?: PublishingContentStatus
}

export const composerDraftsRepository = {
  async create(input: CreateDraftInput) {
    const db = getDatabase()
    const id = generateId()
    const now = new Date()

    await db.insert(composerDrafts).values({
      id,
      userId: input.userId,
      title: input.title,
      sourceNoteIds: input.sourceNoteIds ?? [],
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    })

    return db.select().from(composerDrafts).where(eq(composerDrafts.id, id)).get()!
  },

  async findByUser(userId: string, limit = 50) {
    const db = getDatabase()
    return db
      .select()
      .from(composerDrafts)
      .where(eq(composerDrafts.userId, userId))
      .orderBy(desc(composerDrafts.updatedAt))
      .limit(limit)
  },

  async findById(id: string) {
    const db = getDatabase()
    return db.select().from(composerDrafts).where(eq(composerDrafts.id, id)).get() ?? null
  },

  async update(id: string, input: UpdateDraftInput) {
    const db = getDatabase()
    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (input.title !== undefined) updates.title = input.title
    if (input.sourceNoteIds !== undefined) updates.sourceNoteIds = input.sourceNoteIds
    if (input.status !== undefined) updates.status = input.status

    await db.update(composerDrafts).set(updates as any).where(eq(composerDrafts.id, id))
    return db.select().from(composerDrafts).where(eq(composerDrafts.id, id)).get()!
  },

  async delete(id: string) {
    const db = getDatabase()
    await db.delete(composerDrafts).where(eq(composerDrafts.id, id))
  },
}

// ============================================
// Draft Content (per-platform)
// ============================================

export interface CreateDraftContentInput {
  draftId: string
  platform: PublishingPlatform
  content: string
  format?: string
  metadata?: Record<string, unknown>
}

export const draftContentRepository = {
  async create(input: CreateDraftContentInput) {
    const db = getDatabase()
    const id = generateId()

    await db.insert(draftContent).values({
      id,
      draftId: input.draftId,
      platform: input.platform,
      content: input.content,
      format: input.format ?? 'markdown',
      metadata: input.metadata ?? {},
      createdAt: new Date(),
    })

    return db.select().from(draftContent).where(eq(draftContent.id, id)).get()!
  },

  async findByDraft(draftId: string) {
    const db = getDatabase()
    return db
      .select()
      .from(draftContent)
      .where(eq(draftContent.draftId, draftId))
      .orderBy(draftContent.platform)
  },

  async findByDraftAndPlatform(draftId: string, platform: PublishingPlatform) {
    const db = getDatabase()
    return db
      .select()
      .from(draftContent)
      .where(and(eq(draftContent.draftId, draftId), eq(draftContent.platform, platform)))
      .get() ?? null
  },

  async update(id: string, content: string, metadata?: Record<string, unknown>) {
    const db = getDatabase()
    const updates: Record<string, unknown> = { content }
    if (metadata !== undefined) updates.metadata = metadata

    await db.update(draftContent).set(updates as any).where(eq(draftContent.id, id))
    return db.select().from(draftContent).where(eq(draftContent.id, id)).get()!
  },

  async deleteByDraft(draftId: string) {
    const db = getDatabase()
    await db.delete(draftContent).where(eq(draftContent.draftId, draftId))
  },
}

// ============================================
// Published Posts
// ============================================

export interface CreatePublishedPostInput {
  draftId?: string
  draftContentId?: string
  userId: string
  platform: PublishingPlatform
  accountId?: string
  scheduledFor?: Date
}

export const publishedPostsRepository = {
  async create(input: CreatePublishedPostInput) {
    const db = getDatabase()
    const id = generateId()

    await db.insert(publishedPosts).values({
      id,
      draftId: input.draftId,
      draftContentId: input.draftContentId,
      userId: input.userId,
      platform: input.platform,
      accountId: input.accountId,
      status: input.scheduledFor ? 'scheduled' : 'queued',
      scheduledFor: input.scheduledFor,
      createdAt: new Date(),
    })

    return db.select().from(publishedPosts).where(eq(publishedPosts.id, id)).get()!
  },

  async findByUser(userId: string, limit = 50) {
    const db = getDatabase()
    return db
      .select()
      .from(publishedPosts)
      .where(eq(publishedPosts.userId, userId))
      .orderBy(desc(publishedPosts.createdAt))
      .limit(limit)
  },

  async findById(id: string) {
    const db = getDatabase()
    return db.select().from(publishedPosts).where(eq(publishedPosts.id, id)).get() ?? null
  },

  async updateStatus(id: string, status: PublishingPostStatus, extra?: { platformPostId?: string; url?: string; error?: string }) {
    const db = getDatabase()
    const updates: Record<string, unknown> = { status }
    if (status === 'published') updates.publishedAt = new Date()
    if (extra?.platformPostId) updates.platformPostId = extra.platformPostId
    if (extra?.url) updates.url = extra.url
    if (extra?.error) updates.error = extra.error

    await db.update(publishedPosts).set(updates as any).where(eq(publishedPosts.id, id))
    return db.select().from(publishedPosts).where(eq(publishedPosts.id, id)).get()!
  },

  async incrementRetry(id: string, error: string) {
    const db = getDatabase()
    await db
      .update(publishedPosts)
      .set({
        retryCount: sql`retry_count + 1`,
        error,
      } as any)
      .where(eq(publishedPosts.id, id))
  },
}

// ============================================
// Writing Style Guides
// ============================================

export interface CreateStyleGuideInput {
  userId: string
  name: string
  isDefault?: boolean
  tone?: string
  language?: string
  targetAudience?: string
  customToneDescription?: string
  samplePost?: string
  rules?: unknown[]
  serviceOverrides?: Record<string, unknown>
}

export interface UpdateStyleGuideInput {
  name?: string
  isDefault?: boolean
  tone?: string
  language?: string
  targetAudience?: string
  customToneDescription?: string
  samplePost?: string
  rules?: unknown[]
  serviceOverrides?: Record<string, unknown>
}

export const writingStyleGuidesRepository = {
  async create(input: CreateStyleGuideInput) {
    const db = getDatabase()
    const id = generateId()
    const now = new Date()

    // If setting as default, unset other defaults
    if (input.isDefault) {
      await db
        .update(writingStyleGuides)
        .set({ isDefault: false, updatedAt: now })
        .where(eq(writingStyleGuides.userId, input.userId))
    }

    await db.insert(writingStyleGuides).values({
      id,
      userId: input.userId,
      name: input.name,
      isDefault: input.isDefault ?? false,
      tone: input.tone ?? 'professional',
      language: input.language ?? 'en',
      targetAudience: input.targetAudience,
      customToneDescription: input.customToneDescription,
      samplePost: input.samplePost,
      rules: input.rules ?? [],
      serviceOverrides: input.serviceOverrides ?? {},
      createdAt: now,
      updatedAt: now,
    })

    return db.select().from(writingStyleGuides).where(eq(writingStyleGuides.id, id)).get()!
  },

  async findByUser(userId: string) {
    const db = getDatabase()
    return db
      .select()
      .from(writingStyleGuides)
      .where(eq(writingStyleGuides.userId, userId))
      .orderBy(desc(writingStyleGuides.isDefault), desc(writingStyleGuides.updatedAt))
  },

  async findById(id: string) {
    const db = getDatabase()
    return db.select().from(writingStyleGuides).where(eq(writingStyleGuides.id, id)).get() ?? null
  },

  async findDefault(userId: string) {
    const db = getDatabase()
    return db
      .select()
      .from(writingStyleGuides)
      .where(and(eq(writingStyleGuides.userId, userId), eq(writingStyleGuides.isDefault, true)))
      .get() ?? null
  },

  async update(id: string, userId: string, input: UpdateStyleGuideInput) {
    const db = getDatabase()
    const now = new Date()

    if (input.isDefault) {
      await db
        .update(writingStyleGuides)
        .set({ isDefault: false, updatedAt: now })
        .where(eq(writingStyleGuides.userId, userId))
    }

    const updates: Record<string, unknown> = { updatedAt: now }
    if (input.name !== undefined) updates.name = input.name
    if (input.isDefault !== undefined) updates.isDefault = input.isDefault
    if (input.tone !== undefined) updates.tone = input.tone
    if (input.language !== undefined) updates.language = input.language
    if (input.targetAudience !== undefined) updates.targetAudience = input.targetAudience
    if (input.customToneDescription !== undefined) updates.customToneDescription = input.customToneDescription
    if (input.samplePost !== undefined) updates.samplePost = input.samplePost
    if (input.rules !== undefined) updates.rules = input.rules
    if (input.serviceOverrides !== undefined) updates.serviceOverrides = input.serviceOverrides

    await db.update(writingStyleGuides).set(updates as any).where(eq(writingStyleGuides.id, id))
    return db.select().from(writingStyleGuides).where(eq(writingStyleGuides.id, id)).get()!
  },

  async delete(id: string) {
    const db = getDatabase()
    await db.delete(writingStyleGuides).where(eq(writingStyleGuides.id, id))
  },
}

// ============================================
// Publish Queue
// ============================================

export const publishQueueRepository = {
  async enqueue(publishedPostId: string, scheduledAt?: Date, priority = 0) {
    const db = getDatabase()
    const id = generateId()

    await db.insert(publishQueue).values({
      id,
      publishedPostId,
      priority,
      scheduledAt,
      createdAt: new Date(),
    })

    return db.select().from(publishQueue).where(eq(publishQueue.id, id)).get()!
  },

  async findPending(limit = 10) {
    const db = getDatabase()
    const now = new Date()

    return db
      .select()
      .from(publishQueue)
      .where(
        sql`(${publishQueue.scheduledAt} IS NULL OR ${publishQueue.scheduledAt} <= ${now})
            AND (${publishQueue.nextRetryAt} IS NULL OR ${publishQueue.nextRetryAt} <= ${now})
            AND ${publishQueue.attempts} < ${publishQueue.maxAttempts}`
      )
      .orderBy(desc(publishQueue.priority), publishQueue.createdAt)
      .limit(limit)
  },

  async recordAttempt(id: string, error?: string) {
    const db = getDatabase()

    // Read current attempts to compute proper backoff
    const current = db.select().from(publishQueue).where(eq(publishQueue.id, id)).get()
    const currentAttempts = current?.attempts ?? 0

    const updates: Record<string, unknown> = {
      attempts: sql`attempts + 1`,
    }
    if (error) {
      updates.lastError = error
      // Exponential backoff: 1s, 2s, 4s, 8s, ...
      updates.nextRetryAt = new Date(Date.now() + Math.pow(2, currentAttempts) * 1000)
    }
    await db.update(publishQueue).set(updates as any).where(eq(publishQueue.id, id))
  },

  async remove(id: string) {
    const db = getDatabase()
    await db.delete(publishQueue).where(eq(publishQueue.id, id))
  },
}
