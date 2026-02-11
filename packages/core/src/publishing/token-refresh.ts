// Token Refresh Service
// Handles OAuth2 token refresh for platforms that support it

import type { Platform } from './types.js'
import { PublishError } from './errors.js'

/** Result of a token refresh attempt */
export interface TokenRefreshResult {
  success: boolean
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
  error?: string
}

/** Normalize a timestamp to milliseconds, handling both Unix seconds and milliseconds */
function toMilliseconds(timestamp: number): number {
  return timestamp < 1e12 ? timestamp * 1000 : timestamp
}

/** Check if a token should be refreshed (within buffer of expiry) */
export function shouldRefreshToken(expiresAt: number | undefined, bufferMs: number = 5 * 60 * 1000): boolean {
  if (expiresAt == null) return false
  return toMilliseconds(expiresAt) - Date.now() < bufferMs
}

/** Check if a token is already expired */
export function isTokenExpired(expiresAt: number | undefined): boolean {
  if (expiresAt == null) return false
  return toMilliseconds(expiresAt) <= Date.now()
}

/** Platform-specific refresh configuration */
interface RefreshConfig {
  tokenUrl: string
  buildBody: (refreshToken: string) => URLSearchParams
}

/** Platforms that support OAuth2 token refresh */
const REFRESH_CONFIGS: Partial<Record<Platform, RefreshConfig>> = {
  twitter: {
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    buildBody: (refreshToken) =>
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.TWITTER_CLIENT_ID ?? '',
      }),
  },
  threads: {
    tokenUrl: 'https://graph.threads.net/oauth/access_token',
    buildBody: (refreshToken) =>
      new URLSearchParams({
        grant_type: 'th_refresh_token',
        access_token: refreshToken,
      }),
  },
}

/**
 * Token refresher for OAuth2 platforms.
 * API-key platforms (DevTo, Hashnode, Medium) and app-password platforms (Bluesky)
 * don't need refresh — their tokens don't expire.
 */
export class TokenRefresher {
  /** Check if a platform supports token refresh */
  supportsRefresh(platform: Platform): boolean {
    return platform in REFRESH_CONFIGS
  }

  /** Attempt to refresh an OAuth2 token */
  async refreshToken(platform: Platform, refreshToken: string): Promise<TokenRefreshResult> {
    const config = REFRESH_CONFIGS[platform]
    if (!config) {
      return { success: false, error: `Platform ${platform} does not support token refresh` }
    }

    if (!refreshToken) {
      return { success: false, error: 'No refresh token available' }
    }

    try {
      const body = config.buildBody(refreshToken)
      const res = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })

      if (!res.ok) {
        const errorBody = await res.text().catch(() => '')
        throw PublishError.platformError(
          platform,
          `Token refresh failed (${res.status}): ${errorBody}`
        )
      }

      const data = (await res.json()) as Record<string, unknown>
      const accessToken = data.access_token as string | undefined

      if (!accessToken) {
        return { success: false, error: 'No access token in refresh response' }
      }

      const expiresIn = data.expires_in as number | undefined

      return {
        success: true,
        accessToken,
        refreshToken: (data.refresh_token as string) ?? refreshToken,
        expiresAt: expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : undefined,
      }
    } catch (error) {
      if (error instanceof PublishError) {
        return { success: false, error: error.message }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      }
    }
  }
}
