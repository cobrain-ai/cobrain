// Hashnode Publishing Adapter
// Ported from OmniPost's Hashnode integration
// Uses Hashnode GraphQL API

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

const HASHNODE_API = 'https://gql.hashnode.com'

export class HashnodeAdapter extends BasePublisher {
  readonly meta: PublishingServiceMeta = {
    id: 'hashnode',
    name: 'Hashnode',
    category: 'developer',
    icon: '📝',
    supportsMedia: true,
    supportsThreads: false,
    supportsScheduling: false,
    authType: 'api_key',
  }

  private get publicationId(): string | undefined {
    return this.credentials?.metadata?.publicationId as string | undefined
  }

  async validateCredentials(): Promise<boolean> {
    this.ensureInitialized()
    try {
      const res = await this.graphql(`{ me { id username } }`)
      return !!res.data?.me?.id
    } catch {
      return false
    }
  }

  async publish(content: PublishContent): Promise<PublishResult> {
    this.ensureInitialized()

    if (!this.publicationId) {
      throw PublishError.validationError('hashnode', 'Publication ID is required')
    }

    try {
      const mutation = `
        mutation PublishPost($input: PublishPostInput!) {
          publishPost(input: $input) {
            post {
              id
              url
              slug
            }
          }
        }
      `

      const res = await this.graphql(mutation, {
        input: {
          title: content.title || 'Untitled',
          contentMarkdown: content.format === 'markdown' ? content.body : content.body,
          publicationId: this.publicationId,
          tags: (content.tags || []).map((tag) => ({ slug: tag, name: tag })),
          metaTags: content.metadata?.seoMeta
            ? {
                title: content.title,
                description: (content.metadata.seoMeta as Record<string, string>).metaDescription,
              }
            : undefined,
        },
      })

      if (res.errors?.length) {
        throw PublishError.platformError(
          'hashnode',
          res.errors.map((e: { message: string }) => e.message).join(', ')
        )
      }

      const post = res.data?.publishPost?.post
      return {
        success: true,
        platform: 'hashnode',
        postId: post?.id,
        url: post?.url,
        publishedAt: new Date(),
      }
    } catch (error) {
      if (error instanceof PublishError) throw error
      throw PublishError.networkError('hashnode', error instanceof Error ? error : undefined)
    }
  }

  async adaptContent(raw: RawContent): Promise<AdaptedContent> {
    return ContentPipeline.adaptForPlatform(raw, 'hashnode')
  }

  async getAccountInfo(): Promise<AccountInfo> {
    this.ensureInitialized()
    const res = await this.graphql(`{ me { id username name profilePicture } }`)
    const me = res.data?.me
    return {
      id: me?.id || '',
      name: me?.name || me?.username || '',
      username: me?.username,
      avatarUrl: me?.profilePicture,
      profileUrl: me?.username ? `https://hashnode.com/@${me.username}` : undefined,
    }
  }

  private async graphql(query: string, variables?: Record<string, unknown>): Promise<Record<string, any>> {
    const res = await fetch(HASHNODE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.credentials!.accessToken,
      },
      body: JSON.stringify({ query, variables }),
    })

    if (!res.ok) {
      throw PublishError.platformError('hashnode', `API error: ${res.status}`)
    }

    return res.json()
  }
}

export function createHashnodeAdapter(): HashnodeAdapter {
  return new HashnodeAdapter()
}
