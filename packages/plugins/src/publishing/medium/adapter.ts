// Medium Publishing Adapter
// REST API with Bearer token, markdown-native

import {
  BasePublisher,
  PublishError,
  type PublishingServiceMeta,
  type PublishContent,
  type PublishResult,
  type RawContent,
  type AdaptedContent,
  type AccountInfo,
} from '@cobrain/core'

const MEDIUM_API_BASE = 'https://api.medium.com/v1'

export class MediumAdapter extends BasePublisher {
  readonly meta: PublishingServiceMeta = {
    id: 'medium',
    name: 'Medium',
    category: 'blog',
    icon: '📖',
    supportsMedia: true,
    supportsThreads: false,
    supportsScheduling: false,
    authType: 'api_key', // Integration token treated like API key
  }

  private cachedUser?: { id: string; username: string; name: string; imageUrl?: string }

  async validateCredentials(): Promise<boolean> {
    this.ensureInitialized()
    try {
      const user = await this.getMe()
      return !!user.id
    } catch {
      return false
    }
  }

  async publish(content: PublishContent): Promise<PublishResult> {
    this.ensureInitialized()

    try {
      const user = await this.getMe()

      // Medium limits tags to 5
      const tags = (content.tags ?? []).slice(0, 5)

      const res = await this.apiRequest('POST', `/users/${user.id}/posts`, {
        title: content.title || 'Untitled',
        contentFormat: 'markdown',
        content: content.body,
        tags,
        publishStatus: 'public',
      })

      return {
        success: true,
        platform: 'medium',
        postId: res.id,
        url: res.url,
        publishedAt: new Date(),
      }
    } catch (error) {
      if (error instanceof PublishError) throw error
      throw PublishError.networkError('medium', error instanceof Error ? error : undefined)
    }
  }

  /** Override to return markdown directly — Medium accepts markdown natively */
  async adaptContent(raw: RawContent): Promise<AdaptedContent> {
    return {
      title: raw.title,
      body: raw.body,
      format: 'markdown',
      tags: raw.tags,
      media: raw.media,
      excerpt: raw.body.substring(0, 160).replace(/\s+\S*$/, '') + '...',
    }
  }

  async getAccountInfo(): Promise<AccountInfo> {
    this.ensureInitialized()
    const user = await this.getMe()
    return {
      id: user.id,
      name: user.name || '',
      username: user.username,
      avatarUrl: user.imageUrl,
      profileUrl: `https://medium.com/@${user.username}`,
    }
  }

  /** Get the current user (cached after first call) */
  private async getMe(): Promise<{ id: string; username: string; name: string; imageUrl?: string }> {
    if (this.cachedUser) return this.cachedUser

    const res = await this.apiRequest('GET', '/me')
    this.cachedUser = res as { id: string; username: string; name: string; imageUrl?: string }
    return this.cachedUser
  }

  private async apiRequest(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<Record<string, any>> {
    const res = await fetch(`${MEDIUM_API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.credentials!.accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (res.status === 401) {
      throw PublishError.invalidApiKey('medium')
    }
    if (res.status === 429) {
      throw PublishError.rateLimited('medium')
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw PublishError.platformError(
        'medium',
        `API error ${res.status}: ${JSON.stringify(body)}`
      )
    }

    const json = (await res.json()) as Record<string, unknown>
    // Medium wraps responses in { data: {...} }
    return (json.data ?? json) as Record<string, any>
  }
}

export function createMediumAdapter(): MediumAdapter {
  return new MediumAdapter()
}
