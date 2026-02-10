// Twitter/X Publishing Adapter
// New adapter following OmniPost's pattern for Twitter API v2

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

const TWITTER_API_BASE = 'https://api.twitter.com/2'

export class TwitterAdapter extends BasePublisher {
  readonly meta: PublishingServiceMeta = {
    id: 'twitter',
    name: 'Twitter / X',
    category: 'social',
    icon: '𝕏',
    characterLimit: 280,
    supportsMedia: true,
    supportsThreads: true,
    supportsScheduling: false,
    authType: 'oauth2',
    oauthScopes: ['tweet.read', 'tweet.write', 'users.read'],
  }

  async validateCredentials(): Promise<boolean> {
    this.ensureInitialized()
    try {
      const res = await this.apiRequest('GET', '/users/me')
      return !!res.data?.id
    } catch {
      return false
    }
  }

  async publish(content: PublishContent): Promise<PublishResult> {
    this.ensureInitialized()

    try {
      // Check if content needs to be threaded
      const adapted = content as AdaptedContent
      if (adapted.threadParts && adapted.threadParts.length > 1) {
        return this.publishThread(adapted.threadParts)
      }

      // Single tweet
      const res = await this.apiRequest('POST', '/tweets', {
        text: content.body.substring(0, 280),
      })

      if (!res.data?.id) {
        throw PublishError.platformError('twitter', 'Failed to create tweet')
      }

      const tweetId = res.data.id
      return {
        success: true,
        platform: 'twitter',
        postId: tweetId,
        url: `https://twitter.com/i/status/${tweetId}`,
        publishedAt: new Date(),
      }
    } catch (error) {
      if (error instanceof PublishError) throw error
      throw PublishError.networkError('twitter', error instanceof Error ? error : undefined)
    }
  }

  private async publishThread(parts: string[]): Promise<PublishResult> {
    let lastTweetId: string | undefined
    let firstTweetId: string | undefined

    for (const text of parts) {
      const body: Record<string, unknown> = { text }
      if (lastTweetId) {
        body.reply = { in_reply_to_tweet_id: lastTweetId }
      }

      const res = await this.apiRequest('POST', '/tweets', body)

      if (!res.data?.id) {
        throw PublishError.platformError('twitter', 'Failed to create tweet in thread')
      }

      lastTweetId = res.data.id
      if (!firstTweetId) firstTweetId = lastTweetId
    }

    return {
      success: true,
      platform: 'twitter',
      postId: firstTweetId,
      url: `https://twitter.com/i/status/${firstTweetId}`,
      publishedAt: new Date(),
    }
  }

  async adaptContent(raw: RawContent): Promise<AdaptedContent> {
    return ContentPipeline.adaptForPlatform(raw, 'twitter')
  }

  async getAccountInfo(): Promise<AccountInfo> {
    this.ensureInitialized()
    const res = await this.apiRequest('GET', '/users/me?user.fields=name,username,profile_image_url')
    const user = res.data
    return {
      id: user?.id || '',
      name: user?.name || '',
      username: user?.username,
      avatarUrl: user?.profile_image_url,
      profileUrl: user?.username ? `https://twitter.com/${user.username}` : undefined,
    }
  }

  private async apiRequest(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<Record<string, any>> {
    const res = await fetch(`${TWITTER_API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.credentials!.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (res.status === 401) {
      throw PublishError.authExpired('twitter')
    }
    if (res.status === 429) {
      throw PublishError.rateLimited('twitter')
    }
    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw PublishError.platformError(
        'twitter',
        `API error ${res.status}: ${JSON.stringify(error)}`
      )
    }

    return res.json()
  }
}

export function createTwitterAdapter(): TwitterAdapter {
  return new TwitterAdapter()
}
