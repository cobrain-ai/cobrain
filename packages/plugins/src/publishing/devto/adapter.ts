// Dev.to Publishing Adapter
// REST API with API key auth, markdown-native

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

const DEVTO_API_BASE = 'https://dev.to/api'

export class DevToAdapter extends BasePublisher {
  readonly meta: PublishingServiceMeta = {
    id: 'devto',
    name: 'Dev.to',
    category: 'developer',
    icon: '👩‍💻',
    supportsMedia: true,
    supportsThreads: false,
    supportsScheduling: false,
    authType: 'api_key',
  }

  async validateCredentials(): Promise<boolean> {
    this.ensureInitialized()
    try {
      const res = await this.apiRequest('GET', '/users/me')
      return !!res.id
    } catch {
      return false
    }
  }

  async publish(content: PublishContent): Promise<PublishResult> {
    this.ensureInitialized()

    try {
      // Dev.to limits tags to 4
      const tags = (content.tags ?? []).slice(0, 4)

      const res = await this.apiRequest('POST', '/articles', {
        article: {
          title: content.title || 'Untitled',
          body_markdown: content.body,
          tags,
          published: true,
        },
      })

      return {
        success: true,
        platform: 'devto',
        postId: String(res.id),
        url: res.url,
        publishedAt: new Date(),
      }
    } catch (error) {
      if (error instanceof PublishError) throw error
      throw PublishError.networkError('devto', error instanceof Error ? error : undefined)
    }
  }

  async adaptContent(raw: RawContent): Promise<AdaptedContent> {
    return ContentPipeline.adaptForPlatform(raw, 'devto')
  }

  async getAccountInfo(): Promise<AccountInfo> {
    this.ensureInitialized()
    const res = await this.apiRequest('GET', '/users/me')
    return {
      id: String(res.id),
      name: res.name || res.username || '',
      username: res.username,
      avatarUrl: res.profile_image,
      profileUrl: `https://dev.to/${res.username}`,
    }
  }

  private async apiRequest(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<Record<string, any>> {
    const res = await fetch(`${DEVTO_API_BASE}${path}`, {
      method,
      headers: {
        'api-key': this.credentials!.accessToken,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (res.status === 401) {
      throw PublishError.invalidApiKey('devto')
    }
    if (res.status === 422) {
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
      const detail = typeof body.error === 'string' ? body.error : 'Validation failed'
      throw PublishError.contentRejected('devto', detail)
    }
    if (res.status === 429) {
      throw PublishError.rateLimited('devto')
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw PublishError.platformError(
        'devto',
        `API error ${res.status}: ${JSON.stringify(body)}`
      )
    }

    return res.json()
  }
}

export function createDevToAdapter(): DevToAdapter {
  return new DevToAdapter()
}
