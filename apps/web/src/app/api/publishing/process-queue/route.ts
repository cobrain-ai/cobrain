import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  publishQueueRepository,
  publishedPostsRepository,
  publishingAccountsRepository,
  draftContentRepository,
} from '@cobrain/database'
import {
  PublishingServiceRegistry,
  registerPublishingServices,
  publishingServices,
} from '@cobrain/plugins'
import type { Platform, ServiceCredentials, PublishContent } from '@cobrain/core'

// Ensure publishing services are registered
let servicesRegistered = false
function ensureServicesRegistered(): PublishingServiceRegistry {
  const registry = PublishingServiceRegistry.getInstance()
  if (!servicesRegistered) {
    try {
      registerPublishingServices((entry) => registry.register(entry))
    } catch {
      // Already registered
    }
    servicesRegistered = true
  }
  return registry
}

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000 // 5 minutes

export async function POST(): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const registry = ensureServicesRegistered()
  const stats = { processed: 0, succeeded: 0, failed: 0, skipped: 0 }

  // Get pending queue items (max 5)
  const pendingJobs = await publishQueueRepository.findPending(5)

  for (const job of pendingJobs) {
    stats.processed++

    try {
      // Look up the published post record
      const post = await publishedPostsRepository.findById(job.publishedPostId)
      if (!post) {
        await publishQueueRepository.remove(job.id)
        stats.skipped++
        continue
      }

      // Verify post belongs to this user
      if (post.userId !== session.user.id) {
        stats.skipped++
        continue
      }

      // Get the account credentials
      if (!post.accountId) {
        await publishQueueRepository.recordAttempt(job.id, 'No account linked')
        await publishedPostsRepository.updateStatus(post.id, 'failed', { error: 'No publishing account linked' })
        stats.failed++
        continue
      }

      const account = await publishingAccountsRepository.findById(post.accountId)
      if (!account || !account.isActive) {
        await publishQueueRepository.recordAttempt(job.id, 'Account not found or inactive')
        await publishedPostsRepository.updateStatus(post.id, 'failed', { error: 'Publishing account not found or inactive' })
        stats.failed++
        continue
      }

      // Check token expiry — if within 5-minute buffer, skip
      if (account.tokenExpiresAt) {
        const expiresAt = typeof account.tokenExpiresAt === 'number'
          ? account.tokenExpiresAt * 1000  // Unix seconds to ms
          : new Date(account.tokenExpiresAt).getTime()

        if (expiresAt - Date.now() < TOKEN_EXPIRY_BUFFER_MS) {
          await publishQueueRepository.recordAttempt(job.id, 'Token expiring soon — needs re-auth')
          stats.skipped++
          continue
        }
      }

      // Get the content to publish
      let contentBody: string | null = null
      if (post.draftContentId) {
        // Content is stored in draft_content table — we need the draftId to look it up
        // The draftContentId points directly to the content record
        const dc = await draftContentRepository.findByDraft(post.draftId ?? '')
        const contentRecord = dc.find((c) => c.id === post.draftContentId)
        contentBody = contentRecord?.content ?? null
      }

      if (!contentBody) {
        await publishQueueRepository.recordAttempt(job.id, 'Content not found')
        await publishedPostsRepository.updateStatus(post.id, 'failed', { error: 'Content not found for publishing' })
        stats.failed++
        continue
      }

      // Create the publishing service instance
      const credentials: ServiceCredentials = {
        platform: post.platform as Platform,
        accountId: account.accountId,
        accountName: account.accountName ?? undefined,
        accessToken: account.accessToken,
        refreshToken: account.refreshToken ?? undefined,
        tokenExpiresAt: account.tokenExpiresAt ?? undefined,
        metadata: (account.metadata as Record<string, unknown>) ?? undefined,
      }

      const publishContent: PublishContent = {
        body: contentBody,
        format: 'markdown',
      }

      // Update status to publishing
      await publishedPostsRepository.updateStatus(post.id, 'publishing')

      const service = await registry.createInstance(post.platform as Platform, credentials)
      const result = await service.publish(publishContent)

      if (result.success) {
        await publishedPostsRepository.updateStatus(post.id, 'published', {
          platformPostId: result.postId,
          url: result.url,
        })
        await publishQueueRepository.remove(job.id)
        stats.succeeded++
      } else {
        await publishQueueRepository.recordAttempt(job.id, result.error)
        await publishedPostsRepository.incrementRetry(post.id, result.error ?? 'Unknown error')

        // If max attempts reached, mark as failed
        if ((job.attempts + 1) >= job.maxAttempts) {
          await publishedPostsRepository.updateStatus(post.id, 'failed', { error: result.error })
          await publishQueueRepository.remove(job.id)
        }
        stats.failed++
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      await publishQueueRepository.recordAttempt(job.id, msg)

      // Try to update the post status
      try {
        const post = await publishedPostsRepository.findById(job.publishedPostId)
        if (post) {
          await publishedPostsRepository.incrementRetry(post.id, msg)
          if ((job.attempts + 1) >= job.maxAttempts) {
            await publishedPostsRepository.updateStatus(post.id, 'failed', { error: msg })
            await publishQueueRepository.remove(job.id)
          }
        }
      } catch {
        // best-effort
      }
      stats.failed++
    }
  }

  return NextResponse.json({ stats, jobsRemaining: pendingJobs.length - stats.processed })
}
