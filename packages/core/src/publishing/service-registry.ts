// Publishing Service Registry
// Central management for platform publishing services

import type {
  Platform,
  PublishingService,
  PublishingServiceMeta,
  PublishingServiceEntry,
  ServiceCredentials,
} from './types.js'

/**
 * Registry for publishing service adapters.
 * Platform adapters register themselves here.
 */
export class PublishingServiceRegistry {
  private static instance: PublishingServiceRegistry | null = null
  private services: Map<Platform, PublishingServiceEntry> = new Map()
  private instances: Map<string, PublishingService> = new Map()

  private constructor() {}

  static getInstance(): PublishingServiceRegistry {
    if (!PublishingServiceRegistry.instance) {
      PublishingServiceRegistry.instance = new PublishingServiceRegistry()
    }
    return PublishingServiceRegistry.instance
  }

  static reset(): void {
    if (PublishingServiceRegistry.instance) {
      PublishingServiceRegistry.instance.disposeAll()
      PublishingServiceRegistry.instance = null
    }
  }

  /** Register a platform adapter */
  register(entry: PublishingServiceEntry): void {
    if (this.services.has(entry.meta.id)) {
      throw new Error(`Publishing service "${entry.meta.id}" is already registered`)
    }
    this.services.set(entry.meta.id, entry)
  }

  /** Get metadata for all registered platforms */
  getAvailablePlatforms(): PublishingServiceMeta[] {
    return Array.from(this.services.values()).map((e) => e.meta)
  }

  /** Create and initialize a service instance for a specific account */
  async createInstance(
    platform: Platform,
    credentials: ServiceCredentials
  ): Promise<PublishingService> {
    const entry = this.services.get(platform)
    if (!entry) {
      throw new Error(`No publishing service registered for "${platform}"`)
    }

    const key = `${platform}:${credentials.accountId}`
    const existing = this.instances.get(key)
    if (existing) return existing

    const service = entry.factory()
    await service.initialize(credentials)
    this.instances.set(key, service)
    return service
  }

  /** Get an existing service instance */
  getInstance(platform: Platform, accountId: string): PublishingService | undefined {
    return this.instances.get(`${platform}:${accountId}`)
  }

  /** Dispose a specific service instance */
  async disposeInstance(platform: Platform, accountId: string): Promise<void> {
    const key = `${platform}:${accountId}`
    const instance = this.instances.get(key)
    if (instance) {
      await instance.dispose()
      this.instances.delete(key)
    }
  }

  /** Dispose all service instances */
  async disposeAll(): Promise<void> {
    for (const instance of this.instances.values()) {
      await instance.dispose().catch(() => {})
    }
    this.instances.clear()
  }
}

export function getPublishingRegistry(): PublishingServiceRegistry {
  return PublishingServiceRegistry.getInstance()
}
