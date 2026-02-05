/**
 * Calendar Service
 * Manages calendar connections and event retrieval across providers
 */

import type {
  CalendarProvider,
  CalendarProviderType,
  CalendarProviderConfig,
  CalendarConnection,
  CalendarEvent,
  OAuthTokens,
  GetEventsOptions,
} from './types.js'
import { GoogleCalendarProvider } from './providers/google.js'
import { OutlookCalendarProvider } from './providers/outlook.js'

export interface CalendarServiceConfig {
  google?: CalendarProviderConfig
  outlook?: CalendarProviderConfig
}

export interface TokenStorage {
  getConnection(userId: string, provider: CalendarProviderType): Promise<CalendarConnection | null>
  saveConnection(connection: CalendarConnection): Promise<void>
  deleteConnection(userId: string, provider: CalendarProviderType): Promise<void>
  updateTokens(
    userId: string,
    provider: CalendarProviderType,
    tokens: OAuthTokens
  ): Promise<void>
}

export class CalendarService {
  private providers: Map<CalendarProviderType, CalendarProvider> = new Map()
  private tokenStorage: TokenStorage

  constructor(config: CalendarServiceConfig, tokenStorage: TokenStorage) {
    this.tokenStorage = tokenStorage

    if (config.google) {
      this.providers.set('google', new GoogleCalendarProvider(config.google))
    }

    if (config.outlook) {
      this.providers.set('outlook', new OutlookCalendarProvider(config.outlook))
    }
  }

  /**
   * Get available calendar providers
   */
  getAvailableProviders(): CalendarProviderType[] {
    return Array.from(this.providers.keys())
  }

  /**
   * Get OAuth authorization URL for a provider
   */
  getAuthUrl(provider: CalendarProviderType, state?: string): string {
    const providerInstance = this.providers.get(provider)
    if (!providerInstance) {
      throw new Error(`Provider ${provider} is not configured`)
    }
    return providerInstance.getAuthUrl(state)
  }

  /**
   * Complete OAuth flow and save connection
   */
  async connect(
    userId: string,
    provider: CalendarProviderType,
    authCode: string
  ): Promise<CalendarConnection> {
    const providerInstance = this.providers.get(provider)
    if (!providerInstance) {
      throw new Error(`Provider ${provider} is not configured`)
    }

    // Exchange code for tokens
    const tokens = await providerInstance.exchangeCode(authCode)

    // Get user email
    const email = await providerInstance.getUserEmail(tokens.accessToken)

    // Create connection
    const connection: CalendarConnection = {
      id: `${userId}_${provider}`,
      userId,
      provider,
      email,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Save connection
    await this.tokenStorage.saveConnection(connection)

    return connection
  }

  /**
   * Disconnect a calendar provider
   */
  async disconnect(userId: string, provider: CalendarProviderType): Promise<void> {
    const connection = await this.tokenStorage.getConnection(userId, provider)
    if (!connection) {
      return
    }

    const providerInstance = this.providers.get(provider)
    if (providerInstance) {
      try {
        await providerInstance.revokeToken(connection.accessToken)
      } catch {
        // Ignore revocation errors
      }
    }

    await this.tokenStorage.deleteConnection(userId, provider)
  }

  /**
   * Get calendar events for a user
   */
  async getEvents(
    userId: string,
    provider: CalendarProviderType,
    startDate: Date,
    endDate: Date,
    options?: GetEventsOptions
  ): Promise<CalendarEvent[]> {
    const providerInstance = this.providers.get(provider)
    if (!providerInstance) {
      throw new Error(`Provider ${provider} is not configured`)
    }

    const connection = await this.tokenStorage.getConnection(userId, provider)
    if (!connection) {
      throw new Error(`No connection found for provider ${provider}`)
    }

    // Refresh token if expired
    const accessToken = await this.getValidAccessToken(connection)

    return providerInstance.getEvents(accessToken, startDate, endDate, options)
  }

  /**
   * Get all events from all connected calendars
   */
  async getAllEvents(
    userId: string,
    startDate: Date,
    endDate: Date,
    options?: GetEventsOptions
  ): Promise<CalendarEvent[]> {
    const allEvents: CalendarEvent[] = []

    for (const provider of this.providers.keys()) {
      try {
        const connection = await this.tokenStorage.getConnection(userId, provider)
        if (connection) {
          const events = await this.getEvents(userId, provider, startDate, endDate, options)
          allEvents.push(...events)
        }
      } catch (error) {
        console.error(`Failed to get events from ${provider}:`, error)
      }
    }

    // Sort by start time
    allEvents.sort((a, b) => a.start.getTime() - b.start.getTime())

    return allEvents
  }

  /**
   * Check if a provider is connected for a user
   */
  async isConnected(userId: string, provider: CalendarProviderType): Promise<boolean> {
    const connection = await this.tokenStorage.getConnection(userId, provider)
    return connection !== null
  }

  /**
   * Get connection status for all providers
   */
  async getConnectionStatus(
    userId: string
  ): Promise<Map<CalendarProviderType, { connected: boolean; email?: string }>> {
    const status = new Map<CalendarProviderType, { connected: boolean; email?: string }>()

    for (const provider of this.providers.keys()) {
      const connection = await this.tokenStorage.getConnection(userId, provider)
      status.set(provider, {
        connected: connection !== null,
        email: connection?.email,
      })
    }

    return status
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  private async getValidAccessToken(connection: CalendarConnection): Promise<string> {
    // Check if token is expired (with 5 minute buffer)
    const expiresAt = new Date(connection.expiresAt)
    const bufferMs = 5 * 60 * 1000
    const isExpired = Date.now() > expiresAt.getTime() - bufferMs

    if (!isExpired) {
      return connection.accessToken
    }

    // Refresh token
    const providerInstance = this.providers.get(connection.provider)
    if (!providerInstance) {
      throw new Error(`Provider ${connection.provider} is not configured`)
    }

    const tokens = await providerInstance.refreshAccessToken(connection.refreshToken)

    // Update stored tokens
    await this.tokenStorage.updateTokens(connection.userId, connection.provider, tokens)

    return tokens.accessToken
  }
}
