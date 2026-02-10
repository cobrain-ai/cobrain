// Credential Store
// Encrypted credential management for platform tokens
// Modeled after OmniPost's tokenManager + crypto

import type { ServiceCredentials, Platform } from './types.js'

/**
 * Abstract credential store interface.
 * Implementations handle encryption and storage backend.
 */
export interface CredentialStore {
  /** Save credentials (encrypted) */
  save(credentials: ServiceCredentials): Promise<void>

  /** Get credentials for a platform account */
  get(platform: Platform, accountId: string): Promise<ServiceCredentials | null>

  /** Get all credentials for a user */
  getAll(): Promise<ServiceCredentials[]>

  /** Delete credentials */
  delete(platform: Platform, accountId: string): Promise<void>

  /** Update token (e.g., after refresh) */
  updateToken(
    platform: Platform,
    accountId: string,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: number
  ): Promise<void>

  /** Check if token needs refresh (within buffer period) */
  needsRefresh(credentials: ServiceCredentials, bufferMs?: number): boolean
}

/**
 * Simple credential store that delegates to a storage backend.
 * Token refresh buffer defaults to 5 minutes (from OmniPost).
 */
export class SimpleCredentialStore implements CredentialStore {
  private static readonly REFRESH_BUFFER_MS = 5 * 60 * 1000 // 5 minutes

  constructor(
    private readonly storage: CredentialStorage,
  ) {}

  async save(credentials: ServiceCredentials): Promise<void> {
    await this.storage.set(
      this.key(credentials.platform, credentials.accountId),
      credentials
    )
  }

  async get(platform: Platform, accountId: string): Promise<ServiceCredentials | null> {
    return this.storage.get(this.key(platform, accountId))
  }

  async getAll(): Promise<ServiceCredentials[]> {
    return this.storage.getAll()
  }

  async delete(platform: Platform, accountId: string): Promise<void> {
    await this.storage.delete(this.key(platform, accountId))
  }

  async updateToken(
    platform: Platform,
    accountId: string,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: number
  ): Promise<void> {
    const existing = await this.get(platform, accountId)
    if (!existing) return

    await this.save({
      ...existing,
      accessToken,
      refreshToken: refreshToken ?? existing.refreshToken,
      tokenExpiresAt: expiresAt ?? existing.tokenExpiresAt,
    })
  }

  needsRefresh(credentials: ServiceCredentials, bufferMs?: number): boolean {
    if (!credentials.tokenExpiresAt) return false
    const buffer = bufferMs ?? SimpleCredentialStore.REFRESH_BUFFER_MS
    return Date.now() + buffer >= credentials.tokenExpiresAt * 1000
  }

  private key(platform: Platform, accountId: string): string {
    return `${platform}:${accountId}`
  }
}

/** Storage backend interface for credentials */
export interface CredentialStorage {
  get(key: string): Promise<ServiceCredentials | null>
  getAll(): Promise<ServiceCredentials[]>
  set(key: string, value: ServiceCredentials): Promise<void>
  delete(key: string): Promise<void>
}
