/**
 * Provider factory utilities for API routes
 */

import { ProviderFactory, type LLMProvider } from '@cobrain/core'
import { DEFAULT_MODELS, DEFAULT_OLLAMA_URL, DEFAULT_CLI_PATH } from './constants.js'
import type { ProviderConfig, ProviderType } from './types.js'

export interface CreateProviderOptions {
  type: ProviderType
  config?: Partial<ProviderConfig>
}

/**
 * Create a provider instance from configuration
 * Returns null if required configuration is missing (e.g., API keys)
 */
export function createProvider(options: CreateProviderOptions): LLMProvider | null {
  const { type, config } = options

  switch (type) {
    case 'ollama':
      return ProviderFactory.ollama({
        model: config?.model ?? DEFAULT_MODELS.ollama,
        baseUrl: config?.baseUrl ?? DEFAULT_OLLAMA_URL,
      })

    case 'claude-cli':
      return ProviderFactory.claudeCli({
        cliPath: config?.cliPath ?? DEFAULT_CLI_PATH,
      })

    case 'openai': {
      const apiKey = config?.apiKey ?? process.env.OPENAI_API_KEY
      if (!apiKey) return null
      return ProviderFactory.openai(apiKey, {
        model: config?.model ?? DEFAULT_MODELS.openai,
      })
    }

    case 'anthropic': {
      const apiKey = config?.apiKey ?? process.env.ANTHROPIC_API_KEY
      if (!apiKey) return null
      return ProviderFactory.anthropic(apiKey, {
        model: config?.model ?? DEFAULT_MODELS.anthropic,
      })
    }

    default:
      return null
  }
}

/**
 * Check if a provider type requires an API key
 */
export function requiresApiKey(type: ProviderType): boolean {
  return type === 'openai' || type === 'anthropic'
}
