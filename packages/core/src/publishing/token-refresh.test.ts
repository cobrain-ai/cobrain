import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TokenRefresher, shouldRefreshToken, isTokenExpired } from './token-refresh.js'
import type { Platform } from './types.js'

// Mock fetch globally
global.fetch = vi.fn()

describe('Token Refresh Service', () => {
  let refresher: TokenRefresher

  beforeEach(() => {
    refresher = new TokenRefresher()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Timestamp Utilities', () => {
    describe('shouldRefreshToken', () => {
      it('should return false when expiresAt is undefined', () => {
        expect(shouldRefreshToken(undefined)).toBe(false)
      })

      it('should return true when token expires within buffer (5 minutes)', () => {
        const expiresAt = Math.floor(Date.now() / 1000) + 60 // 1 minute from now (in seconds)
        expect(shouldRefreshToken(expiresAt)).toBe(true)
      })

      it('should return false when token expires after buffer', () => {
        const expiresAt = Math.floor(Date.now() / 1000) + 600 // 10 minutes from now (in seconds)
        expect(shouldRefreshToken(expiresAt)).toBe(false)
      })

      it('should handle millisecond timestamps', () => {
        const expiresAt = Date.now() + 60000 // 1 minute from now (in milliseconds)
        expect(shouldRefreshToken(expiresAt)).toBe(true)
      })

      it('should handle custom buffer time', () => {
        const expiresAt = Math.floor(Date.now() / 1000) + 120 // 2 minutes from now
        const bufferMs = 3 * 60 * 1000 // 3 minute buffer

        expect(shouldRefreshToken(expiresAt, bufferMs)).toBe(true)
      })

      it('should normalize Unix seconds to milliseconds', () => {
        // Unix timestamp in seconds (< 1e12)
        const expiresAt = Math.floor(Date.now() / 1000) + 60
        expect(shouldRefreshToken(expiresAt)).toBe(true)
      })
    })

    describe('isTokenExpired', () => {
      it('should return false when expiresAt is undefined', () => {
        expect(isTokenExpired(undefined)).toBe(false)
      })

      it('should return true when token is expired', () => {
        const expiresAt = Math.floor(Date.now() / 1000) - 60 // 1 minute ago (in seconds)
        expect(isTokenExpired(expiresAt)).toBe(true)
      })

      it('should return false when token is not expired', () => {
        const expiresAt = Math.floor(Date.now() / 1000) + 60 // 1 minute from now (in seconds)
        expect(isTokenExpired(expiresAt)).toBe(false)
      })

      it('should handle millisecond timestamps', () => {
        const expiresAt = Date.now() - 60000 // 1 minute ago (in milliseconds)
        expect(isTokenExpired(expiresAt)).toBe(true)
      })

      it('should handle exactly expired tokens', () => {
        const expiresAt = Math.floor(Date.now() / 1000)
        expect(isTokenExpired(expiresAt)).toBe(true)
      })
    })
  })

  describe('TokenRefresher', () => {
    describe('supportsRefresh', () => {
      it('should return true for Twitter', () => {
        expect(refresher.supportsRefresh('twitter')).toBe(true)
      })

      it('should return true for Threads', () => {
        expect(refresher.supportsRefresh('threads')).toBe(true)
      })

      it('should return false for API-key platforms', () => {
        expect(refresher.supportsRefresh('devto')).toBe(false)
        expect(refresher.supportsRefresh('hashnode')).toBe(false)
        expect(refresher.supportsRefresh('medium')).toBe(false)
      })

      it('should return false for app-password platforms', () => {
        expect(refresher.supportsRefresh('bluesky')).toBe(false)
      })

      it('should return false for other platforms', () => {
        expect(refresher.supportsRefresh('linkedin')).toBe(false)
        expect(refresher.supportsRefresh('mastodon')).toBe(false)
      })
    })

    describe('refreshToken', () => {
      describe('Twitter', () => {
        const platform: Platform = 'twitter'

        it('should successfully refresh token', async () => {
          const mockResponse = {
            access_token: 'new_access_token',
            refresh_token: 'new_refresh_token',
            expires_in: 7200,
          }

          vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
          } as Response)

          const result = await refresher.refreshToken(platform, 'old_refresh_token')

          expect(result.success).toBe(true)
          expect(result.accessToken).toBe('new_access_token')
          expect(result.refreshToken).toBe('new_refresh_token')
          expect(result.expiresAt).toBeDefined()
          expect(result.error).toBeUndefined()

          // Verify fetch was called with correct parameters
          expect(fetch).toHaveBeenCalledWith(
            'https://api.twitter.com/2/oauth2/token',
            expect.objectContaining({
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            })
          )
        })

        it('should use old refresh token if new one not provided', async () => {
          const mockResponse = {
            access_token: 'new_access_token',
            // No refresh_token in response
            expires_in: 7200,
          }

          vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
          } as Response)

          const result = await refresher.refreshToken(platform, 'old_refresh_token')

          expect(result.success).toBe(true)
          expect(result.refreshToken).toBe('old_refresh_token') // Uses old token
        })

        it('should handle missing access token in response', async () => {
          const mockResponse = {
            // No access_token
            refresh_token: 'new_refresh_token',
          }

          vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
          } as Response)

          const result = await refresher.refreshToken(platform, 'refresh_token')

          expect(result.success).toBe(false)
          expect(result.error).toContain('No access token in refresh response')
        })

        it('should handle HTTP error responses', async () => {
          vi.mocked(fetch).mockResolvedValueOnce({
            ok: false,
            status: 401,
            text: async () => 'Invalid refresh token',
          } as Response)

          const result = await refresher.refreshToken(platform, 'invalid_token')

          expect(result.success).toBe(false)
          expect(result.error).toContain('Token refresh failed')
          expect(result.error).toContain('401')
        })

        it('should handle network errors', async () => {
          vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

          const result = await refresher.refreshToken(platform, 'refresh_token')

          expect(result.success).toBe(false)
          expect(result.error).toContain('Network error')
        })

        it('should return error when refresh token is missing', async () => {
          const result = await refresher.refreshToken(platform, '')

          expect(result.success).toBe(false)
          expect(result.error).toBe('No refresh token available')
          expect(fetch).not.toHaveBeenCalled()
        })

        it('should calculate expiresAt correctly', async () => {
          const mockResponse = {
            access_token: 'new_token',
            expires_in: 3600, // 1 hour
          }

          vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
          } as Response)

          const beforeCall = Math.floor(Date.now() / 1000)
          const result = await refresher.refreshToken(platform, 'refresh_token')
          const afterCall = Math.floor(Date.now() / 1000)

          expect(result.success).toBe(true)
          expect(result.expiresAt).toBeGreaterThanOrEqual(beforeCall + 3600)
          expect(result.expiresAt).toBeLessThanOrEqual(afterCall + 3600)
        })
      })

      describe('Threads', () => {
        const platform: Platform = 'threads'

        it('should successfully refresh token for Threads', async () => {
          const mockResponse = {
            access_token: 'new_threads_token',
            expires_in: 5184000, // 60 days
          }

          vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
          } as Response)

          const result = await refresher.refreshToken(platform, 'old_threads_token')

          expect(result.success).toBe(true)
          expect(result.accessToken).toBe('new_threads_token')

          // Verify Threads-specific endpoint
          expect(fetch).toHaveBeenCalledWith(
            'https://graph.threads.net/oauth/access_token',
            expect.objectContaining({
              method: 'POST',
            })
          )

          // Verify Threads-specific grant type
          const callArgs = vi.mocked(fetch).mock.calls[0]
          const body = callArgs[1]?.body as string
          expect(body).toContain('grant_type=th_refresh_token')
        })
      })

      describe('Unsupported Platforms', () => {
        it('should return error for platforms without refresh support', async () => {
          const platforms: Platform[] = ['devto', 'hashnode', 'medium', 'bluesky', 'linkedin']

          for (const platform of platforms) {
            const result = await refresher.refreshToken(platform, 'token')

            expect(result.success).toBe(false)
            expect(result.error).toContain('does not support token refresh')
            expect(fetch).not.toHaveBeenCalled()

            vi.clearAllMocks()
          }
        })
      })

      describe('Error Handling', () => {
        it('should handle malformed JSON responses', async () => {
          vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => {
              throw new Error('Invalid JSON')
            },
          } as Response)

          const result = await refresher.refreshToken('twitter', 'token')

          expect(result.success).toBe(false)
          expect(result.error).toBeDefined()
        })

        it('should handle error when reading response text fails', async () => {
          vi.mocked(fetch).mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: async () => {
              throw new Error('Cannot read response')
            },
          } as Response)

          const result = await refresher.refreshToken('twitter', 'token')

          expect(result.success).toBe(false)
          expect(result.error).toContain('500')
        })
      })
    })
  })
})
