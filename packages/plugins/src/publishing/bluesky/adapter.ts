// Bluesky Publishing Adapter
// AT Protocol with app password auth, session-based

import {
  BasePublisher,
  ContentPipeline,
  PublishError,
  type AccountInfo,
  type AdaptedContent,
  type PublishContent,
  type PublishingServiceMeta,
  type PublishResult,
  type RawContent,
  type ServiceCredentials,
} from '@cobrain/core'

const BSKY_API_BASE = 'https://bsky.social/xrpc'

/** AT Protocol facet for rich text (links) */
interface Facet {
  index: { byteStart: number; byteEnd: number }
  features: Array<{ $type: string; uri?: string }>
}

export class BlueskyAdapter extends BasePublisher {
  readonly meta: PublishingServiceMeta = {
    id: 'bluesky',
    name: 'Bluesky',
    category: 'social',
    icon: '🦋',
    characterLimit: 300,
    supportsMedia: true,
    supportsThreads: false,
    supportsScheduling: false,
    authType: 'api_key', // App password treated like an API key
  }

  private sessionToken?: string
  private did?: string

  override async initialize(credentials: ServiceCredentials): Promise<void> {
    await super.initialize(credentials)
    await this.createSession()
  }

  async validateCredentials(): Promise<boolean> {
    this.ensureInitialized()
    try {
      const res = await this.xrpc('app.bsky.actor.getProfile', 'GET', {
        actor: this.did!,
      })
      return !!res.did
    } catch {
      return false
    }
  }

  async publish(content: PublishContent): Promise<PublishResult> {
    this.ensureInitialized()

    try {
      const text = content.body.substring(0, 300)
      const facets = this.extractUrlFacets(text)

      const record: Record<string, unknown> = {
        $type: 'app.bsky.feed.post',
        text,
        createdAt: new Date().toISOString(),
      }

      if (facets.length > 0) {
        record.facets = facets
      }

      const res = await this.xrpc('com.atproto.repo.createRecord', 'POST', undefined, {
        repo: this.did!,
        collection: 'app.bsky.feed.post',
        record,
      })

      const uri = res.uri as string
      // Extract rkey from at:// URI for web URL
      const rkey = uri.split('/').pop()

      return {
        success: true,
        platform: 'bluesky',
        postId: uri,
        url: `https://bsky.app/profile/${this.did}/post/${rkey}`,
        publishedAt: new Date(),
      }
    } catch (error) {
      if (error instanceof PublishError) throw error
      throw PublishError.networkError('bluesky', error instanceof Error ? error : undefined)
    }
  }

  async adaptContent(raw: RawContent): Promise<AdaptedContent> {
    return ContentPipeline.adaptForPlatform(raw, 'bluesky')
  }

  async getAccountInfo(): Promise<AccountInfo> {
    this.ensureInitialized()
    const res = await this.xrpc('app.bsky.actor.getProfile', 'GET', {
      actor: this.did!,
    })
    return {
      id: res.did as string,
      name: (res.displayName as string) || (res.handle as string) || '',
      username: res.handle as string,
      avatarUrl: res.avatar as string | undefined,
      profileUrl: `https://bsky.app/profile/${res.handle}`,
    }
  }

  /** Create an AT Protocol session using app password */
  private async createSession(): Promise<void> {
    const handle = (this.credentials!.metadata?.handle as string) ?? this.credentials!.accountId
    const appPassword = this.credentials!.accessToken

    const res = await fetch(`${BSKY_API_BASE}/com.atproto.server.createSession`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: handle, password: appPassword }),
    })

    if (!res.ok) {
      throw PublishError.authExpired('bluesky')
    }

    const data = (await res.json()) as Record<string, unknown>
    this.sessionToken = data.accessJwt as string
    this.did = data.did as string
  }

  /** Refresh the session using the refresh JWT */
  private async refreshSession(): Promise<void> {
    const res = await fetch(`${BSKY_API_BASE}/com.atproto.server.refreshSession`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.sessionToken}` },
    })

    if (!res.ok) {
      // If refresh fails, try a full re-create
      await this.createSession()
      return
    }

    const data = (await res.json()) as Record<string, unknown>
    this.sessionToken = data.accessJwt as string
    this.did = data.did as string
  }

  /** Make an XRPC call with auto-retry on 401 */
  private async xrpc(
    nsid: string,
    method: 'GET' | 'POST',
    params?: Record<string, string>,
    body?: Record<string, unknown>
  ): Promise<Record<string, any>> {
    const doRequest = async (): Promise<Response> => {
      let url = `${BSKY_API_BASE}/${nsid}`
      if (params) {
        const qs = new URLSearchParams(params)
        url += `?${qs.toString()}`
      }

      return fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      })
    }

    let res = await doRequest()

    // Auto-retry on 401 with session refresh
    if (res.status === 401) {
      await this.refreshSession()
      res = await doRequest()
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw PublishError.platformError(
        'bluesky',
        `XRPC error ${res.status}: ${JSON.stringify(body)}`
      )
    }

    return res.json()
  }

  /** Extract URL facets using byte offsets (AT Protocol requirement) */
  private extractUrlFacets(text: string): Facet[] {
    const facets: Facet[] = []
    const urlRegex = /https?:\/\/[^\s)>\]]+/g
    const encoder = new TextEncoder()
    let match: RegExpExecArray | null

    while ((match = urlRegex.exec(text)) !== null) {
      const url = match[0]
      const byteStart = encoder.encode(text.substring(0, match.index)).length
      const byteEnd = byteStart + encoder.encode(url).length

      facets.push({
        index: { byteStart, byteEnd },
        features: [{ $type: 'app.bsky.richtext.facet#link', uri: url }],
      })
    }

    return facets
  }
}

export function createBlueskyAdapter(): BlueskyAdapter {
  return new BlueskyAdapter()
}
