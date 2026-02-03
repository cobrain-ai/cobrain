/**
 * Provider-related types for the settings UI and API
 */

import type { ProviderType } from '@cobrain/core'

// Re-export for convenience
export type { ProviderType } from '@cobrain/core'

/**
 * Connection status for a provider
 */
export type ProviderConnectionStatus = 'connected' | 'disconnected' | 'testing' | 'error'

/**
 * Status information for a provider displayed in the UI
 */
export interface ProviderStatus {
  id: string
  name: string
  type: ProviderType
  status: ProviderConnectionStatus
  latency?: number
  model?: string
  available: boolean
  error?: string
}

/**
 * Configuration for a single provider
 */
export interface ProviderConfig {
  type: ProviderType
  enabled: boolean
  model?: string
  apiKey?: string
  baseUrl?: string
  cliPath?: string
}

/**
 * User's complete provider configuration
 */
export interface UserProviderConfig {
  activeProvider: string
  configs: Record<string, ProviderConfig>
}

/**
 * Result from testing a provider connection
 */
export interface ProviderTestResult {
  status: ProviderConnectionStatus
  available: boolean
  latency?: number
  model?: string
  error?: string
  testResponse?: string
}

/**
 * Provider metadata for display
 */
export interface ProviderInfo {
  id: string
  name: string
  type: ProviderType
}
