// Threads Publishing Adapter
// Ported from OmniPost's Threads integration
// Uses Meta Graph API for Threads publishing

import {
  BasePublisher,
  PublishError,
  ContentPipeline,
  type PublishingServiceMeta,
  type PublishContent,
  type PublishResult,
  type RawContent,
  type AdaptedContent,
  type AccountInfo,
} from '@cobrain/core'

const THREADS_API_BASE = 'https://graph.threads.net/v1.0'

export class ThreadsAdapter extends BasePublisher {
  readonly meta: PublishingServiceMeta = {
    id: 'threads',
    name: 'Threads',
    category: 'social',
    icon: '🧵',
    characterLimit: 500,
    supportsMedia: true,
    supportsThreads: true,
    supportsScheduling: false,
    authType: 'oauth2',
    oauthScopes: ['threads_basic', 'threads_content_publish'],
  }

  async validateCredentials(): Promise<boolean> {
    this.ensureInitialized()
    try {
      const res = await fetch(
        `${THREADS_API_BASE}/me?fields=id,username&access_token=${this.credentials!.accessToken}`
      )
      return res.ok
    } catch {
      return false
    }
  }

  async publish(content: PublishContent): Promise<PublishResult> {
    this.ensureInitialized()
    const token = this.credentials!.accessToken
    const userId = this.credentials!.accountId

    try {
      // Step 1: Create media container (from OmniPost's two-step process)
      const createRes = await fetch(
        `${THREADS_API_BASE}/${userId}/threads`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: content.body,
            media_type: 'TEXT',
            access_token: token,
          }),
        }
      )

      if (!createRes.ok) {
        const error = await createRes.json().catch(() => ({}))
        throw PublishError.platformError(
          'threads',
          `Failed to create container: ${(error as Record<string, unknown>).error ?? createRes.statusText}`
        )
      }

      const { id: containerId } = (await createRes.json()) as { id: string }

      // Step 2: Publish the container
      const publishRes = await fetch(
        `${THREADS_API_BASE}/${userId}/threads_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: containerId,
            access_token: token,
          }),
        }
      )

      if (!publishRes.ok) {
        throw PublishError.platformError('threads', 'Failed to publish thread')
      }

      const { id: postId } = (await publishRes.json()) as { id: string }

      return {
        success: true,
        platform: 'threads',
        postId,
        url: `https://www.threads.net/post/${postId}`,
        publishedAt: new Date(),
      }
    } catch (error) {
      if (error instanceof PublishError) throw error
      throw PublishError.networkError('threads', error instanceof Error ? error : undefined)
    }
  }

  async adaptContent(raw: RawContent): Promise<AdaptedContent> {
    return ContentPipeline.adaptForPlatform(raw, 'threads')
  }

  async getAccountInfo(): Promise<AccountInfo> {
    this.ensureInitialized()
    const res = await fetch(
      `${THREADS_API_BASE}/me?fields=id,username,name,threads_profile_picture_url&access_token=${this.credentials!.accessToken}`
    )
    const data = (await res.json()) as Record<string, string>
    return {
      id: data.id,
      name: data.name || data.username,
      username: data.username,
      avatarUrl: data.threads_profile_picture_url,
      profileUrl: `https://www.threads.net/@${data.username}`,
    }
  }
}

export function createThreadsAdapter(): ThreadsAdapter {
  return new ThreadsAdapter()
}
