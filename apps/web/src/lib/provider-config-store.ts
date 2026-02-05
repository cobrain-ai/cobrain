/**
 * In-memory storage for user provider configurations
 * TODO: Replace with database persistence
 */

import { getDefaultProviderConfigs } from './providers/constants'
import type { ProviderConfig, UserProviderConfig } from './providers/types'

// Re-export types for convenience
export type { ProviderConfig, UserProviderConfig }

export class ProviderConfigStore {
  private static instance: ProviderConfigStore
  private configs = new Map<string, UserProviderConfig>()

  private constructor() {}

  static getInstance(): ProviderConfigStore {
    if (!ProviderConfigStore.instance) {
      ProviderConfigStore.instance = new ProviderConfigStore()
    }
    return ProviderConfigStore.instance
  }

  get(userId: string): UserProviderConfig {
    return this.configs.get(userId) ?? this.getDefaultConfig()
  }

  set(userId: string, config: UserProviderConfig): void {
    this.configs.set(userId, config)
  }

  private getDefaultConfig(): UserProviderConfig {
    return {
      activeProvider: 'ollama',
      configs: getDefaultProviderConfigs(),
    }
  }
}

export const providerConfigStore = ProviderConfigStore.getInstance()
