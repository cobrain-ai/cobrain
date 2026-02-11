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
} from '@cobrain/plugins'
import type { Platform, ServiceCredentials, PublishContent } from '@cobrain/core'
import { shouldRefreshToken, TokenRefresher } from '@cobrain/core'

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
const tokenRefresher = new TokenRefresher()

interface ProcessingStats {
  processed: number
  succeeded: number
  failed: number
  skipped: number
}

/** Record a job failure with a reason, updating both the queue and the post status */
async function failJob(
  jobId: string,
  postId: string,
  reason: string,
  userMessage?: string,
): Promise<void> {
  await publishQueueRepository.recordAttempt(jobId, reason)
  await publishedPostsRepository.updateStatus(postId, 'failed', {
    error: userMessage ?? reason,
  })
}

/** Check if max attempts have been reached and finalize the job if so */
async function finalizeIfMaxAttempts(
  jobId: string,
  postId: string,
  attempts: number,
  maxAttempts: number,
  errorMessage: string,
): Promise<void> {
  if (attempts + 1 >= maxAttempts) {
    await publishedPostsRepository.updateStatus(postId, 'failed', { error: errorMessage })
    await publishQueueRepository.remove(jobId)
  }
}

export async function POST(): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const registry = ensureServicesRegistered()
  const stats: ProcessingStats = { processed: 0, succeeded: 0, failed: 0, skipped: 0 }

  const pendingJobs = await publishQueueRepository.findPending(5)

  for (const job of pendingJobs) {
    stats.processed++

    try {
      const post = await publishedPostsRepository.findById(job.publishedPostId)
      if (!post) {
        await publishQueueRepository.remove(job.id)
        stats.skipped++
        continue
      }

      if (post.userId !== session.user.id) {
        stats.skipped++
        continue
      }

      if (!post.accountId) {
        await failJob(job.id, post.id, 'No account linked', 'No publishing account linked')
        stats.failed++
        continue
      }

      let account = await publishingAccountsRepository.findById(post.accountId)
      if (!account || !account.isActive) {
        await failJob(job.id, post.id, 'Account not found or inactive', 'Publishing account not found or inactive')
        stats.failed++
        continue
      }

      // Attempt token refresh if the token is expiring soon
      if (shouldRefreshToken(account.tokenExpiresAt ?? undefined, TOKEN_EXPIRY_BUFFER_MS)) {
        const platform = post.platform as Platform

        if (!tokenRefresher.supportsRefresh(platform) || !account.refreshToken) {
          await publishQueueRepository.recordAttempt(job.id, 'Token expiring soon — needs re-auth')
          stats.skipped++
          continue
        }

        const refreshResult = await tokenRefresher.refreshToken(platform, account.refreshToken)

        if (!refreshResult.success || !refreshResult.accessToken) {
          await publishingAccountsRepository.update(account.id, { isActive: false })
          await failJob(
            job.id,
            post.id,
            `Token refresh failed: ${refreshResult.error}`,
            'Could not refresh your login. Please reconnect your account.',
          )
          stats.failed++
          continue
        }

        await publishingAccountsRepository.update(account.id, {
          accessToken: refreshResult.accessToken,
          refreshToken: refreshResult.refreshToken,
          tokenExpiresAt: refreshResult.expiresAt,
        })
        account = { ...account, accessToken: refreshResult.accessToken }
      }

      // Look up the draft content to publish
      let contentBody: string | null = null
      if (post.draftContentId) {
        const draftContents = await draftContentRepository.findByDraft(post.draftId ?? '')
        const contentRecord = draftContents.find((c) => c.id === post.draftContentId)
        contentBody = contentRecord?.content ?? null
      }

      if (!contentBody) {
        await failJob(job.id, post.id, 'Content not found', 'Content not found for publishing')
        stats.failed++
        continue
      }

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
        const errorMsg = result.error ?? 'Unknown error'
        await publishQueueRepository.recordAttempt(job.id, result.error)
        await publishedPostsRepository.incrementRetry(post.id, errorMsg)
        await finalizeIfMaxAttempts(job.id, post.id, job.attempts, job.maxAttempts, errorMsg)
        stats.failed++
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      await publishQueueRepository.recordAttempt(job.id, msg)

      // Best-effort: update the post status on unexpected errors
      try {
        const post = await publishedPostsRepository.findById(job.publishedPostId)
        if (post) {
          await publishedPostsRepository.incrementRetry(post.id, msg)
          await finalizeIfMaxAttempts(job.id, post.id, job.attempts, job.maxAttempts, msg)
        }
      } catch {
        // best-effort
      }
      stats.failed++
    }
  }

  return NextResponse.json({ stats, jobsRemaining: pendingJobs.length - stats.processed })
}
