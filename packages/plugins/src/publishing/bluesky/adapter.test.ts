import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BlueskyAdapter } from './adapter.js'
import type { ServiceCredentials, PublishContent, RawContent } from '@cobrain/core'

// Mock fetch globally
global.fetch = vi.fn()

describe('BlueskyAdapter', () => {
  let adapter: BlueskyAdapter
  let mockCredentials: ServiceCredentials

  beforeEach(() => {
    adapter = new BlueskyAdapter()
    mockCredentials = {
      accountId: 'user.bsky.social',
      accessToken: 'app_password_here',
      refreshToken: undefined,
      expiresAt: undefined,
      metadata: {
        handle: 'user.bsky.social',
      },
    }
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Metadata', () => {
    it('should have correct service metadata', () => {
      expect(adapter.meta.id).toBe('bluesky')
      expect(adapter.meta.name).toBe('Bluesky')
      expect(adapter.meta.category).toBe('social')
      expect(adapter.meta.characterLimit).toBe(300)
      expect(adapter.meta.supportsMedia).toBe(true)
      expect(adapter.meta.supportsThreads).toBe(false)
      expect(adapter.meta.authType).toBe('api_key')
    })
  })

  describe('initialize', () => {
    it('should create session successfully', async () => {
      const mockSession = {
        accessJwt: 'session_token_here',
        refreshJwt: 'refresh_token_here',
        did: 'did:plc:abc123',
        handle: 'user.bsky.social',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSession,
      } as Response)

      await adapter.initialize(mockCredentials)

      expect(fetch).toHaveBeenCalledWith(
        'https://bsky.social/xrpc/com.atproto.server.createSession',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: 'user.bsky.social',
            password: 'app_password_here',
          }),
        })
      )
    })

    it('should throw error on failed session creation', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response)

      await expect(adapter.initialize(mockCredentials)).rejects.toThrow()
    })
  })

  describe('publish', () => {
    beforeEach(async () => {
      // Mock successful session creation
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessJwt: 'session_token',
          did: 'did:plc:user123',
        }),
      } as Response)

      await adapter.initialize(mockCredentials)
      vi.clearAllMocks()
    })

    it('should publish a post successfully', async () => {
      const mockPublishResponse = {
        uri: 'at://did:plc:user123/app.bsky.feed.post/rkey123',
        cid: 'bafyreiabc...',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPublishResponse,
      } as Response)

      const content: PublishContent = {
        platform: 'bluesky',
        body: 'Test post for Bluesky',
      }

      const result = await adapter.publish(content)

      expect(result.success).toBe(true)
      expect(result.platform).toBe('bluesky')
      expect(result.postId).toBe('at://did:plc:user123/app.bsky.feed.post/rkey123')
      expect(result.url).toBe('https://bsky.app/profile/did:plc:user123/post/rkey123')
      expect(result.publishedAt).toBeInstanceOf(Date)
    })

    it('should truncate content to 300 characters', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          uri: 'at://did:plc:user123/app.bsky.feed.post/rkey',
        }),
      } as Response)

      const longContent = 'A'.repeat(500)
      const content: PublishContent = {
        platform: 'bluesky',
        body: longContent,
      }

      await adapter.publish(content)

      const callArgs = vi.mocked(fetch).mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)
      expect(body.record.text.length).toBe(300)
    })

    it('should extract URL facets', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          uri: 'at://did:plc:user123/app.bsky.feed.post/rkey',
        }),
      } as Response)

      const content: PublishContent = {
        platform: 'bluesky',
        body: 'Check out https://example.com and https://test.com',
      }

      await adapter.publish(content)

      const callArgs = vi.mocked(fetch).mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)

      expect(body.record.facets).toBeDefined()
      expect(body.record.facets).toHaveLength(2)
      expect(body.record.facets[0].features[0].uri).toBe('https://example.com')
      expect(body.record.facets[1].features[0].uri).toBe('https://test.com')
    })

    it('should handle byte offsets correctly for UTF-8', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          uri: 'at://did:plc:user123/app.bsky.feed.post/rkey',
        }),
      } as Response)

      const content: PublishContent = {
        platform: 'bluesky',
        body: '🦋 Bluesky https://bsky.app is great!',
      }

      await adapter.publish(content)

      const callArgs = vi.mocked(fetch).mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)

      // Emoji takes 4 bytes, so byte offsets should account for this
      expect(body.record.facets[0].index.byteStart).toBeGreaterThan(10)
    })

    it('should auto-retry on 401 with session refresh', async () => {
      // First request fails with 401
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response)

      // Session refresh succeeds
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessJwt: 'new_session_token',
          did: 'did:plc:user123',
        }),
      } as Response)

      // Retry succeeds
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          uri: 'at://did:plc:user123/app.bsky.feed.post/rkey',
        }),
      } as Response)

      const content: PublishContent = {
        platform: 'bluesky',
        body: 'Test post',
      }

      const result = await adapter.publish(content)

      expect(result.success).toBe(true)
      expect(fetch).toHaveBeenCalledTimes(3) // Original + refresh + retry
    })

    it('should throw error on failed publish', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      } as Response)

      const content: PublishContent = {
        platform: 'bluesky',
        body: 'Test',
      }

      await expect(adapter.publish(content)).rejects.toThrow()
    })
  })

  describe('validateCredentials', () => {
    beforeEach(async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessJwt: 'session_token',
          did: 'did:plc:user123',
        }),
      } as Response)

      await adapter.initialize(mockCredentials)
      vi.clearAllMocks()
    })

    it('should return true for valid credentials', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          did: 'did:plc:user123',
          handle: 'user.bsky.social',
        }),
      } as Response)

      const isValid = await adapter.validateCredentials()

      expect(isValid).toBe(true)
    })

    it('should return false for invalid credentials', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const isValid = await adapter.validateCredentials()

      expect(isValid).toBe(false)
    })
  })

  describe('getAccountInfo', () => {
    beforeEach(async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessJwt: 'session_token',
          did: 'did:plc:user123',
        }),
      } as Response)

      await adapter.initialize(mockCredentials)
      vi.clearAllMocks()
    })

    it('should return account information', async () => {
      const mockProfile = {
        did: 'did:plc:user123',
        handle: 'user.bsky.social',
        displayName: 'Test User',
        avatar: 'https://cdn.bsky.app/avatar.jpg',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      } as Response)

      const accountInfo = await adapter.getAccountInfo()

      expect(accountInfo.id).toBe('did:plc:user123')
      expect(accountInfo.name).toBe('Test User')
      expect(accountInfo.username).toBe('user.bsky.social')
      expect(accountInfo.avatarUrl).toBe('https://cdn.bsky.app/avatar.jpg')
      expect(accountInfo.profileUrl).toBe('https://bsky.app/profile/user.bsky.social')
    })

    it('should use handle as name if displayName is missing', async () => {
      const mockProfile = {
        did: 'did:plc:user123',
        handle: 'user.bsky.social',
        // No displayName
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      } as Response)

      const accountInfo = await adapter.getAccountInfo()

      expect(accountInfo.name).toBe('user.bsky.social')
    })
  })

  describe('adaptContent', () => {
    it('should adapt content for Bluesky', async () => {
      const rawContent: RawContent = {
        title: 'Test Post',
        body: '# Heading\n\nThis is **bold** text with https://example.com link.',
        tags: ['test', 'bluesky'],
        media: [],
      }

      const adapted = await adapter.adaptContent(rawContent)

      expect(adapted.format).toBe('plaintext')
      expect(adapted.body).not.toContain('#')
      expect(adapted.body).not.toContain('**')
      expect(adapted.body.length).toBeLessThanOrEqual(300)
      expect(adapted.tags).toEqual(['test', 'bluesky'])
    })
  })
})
