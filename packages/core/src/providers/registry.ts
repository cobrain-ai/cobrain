import type { LLMProvider, LLMProviderConfig, ProviderType } from '../types/index.js'
import { OllamaProvider } from './ollama.js'
import { ClaudeCliProvider } from './claude-cli.js'
import { OpenAIProvider } from './openai.js'
import { AnthropicProvider } from './anthropic.js'
import { LocalLLMProvider } from './local-llm.js'

type ProviderConstructor = new (config?: LLMProviderConfig) => LLMProvider

export class ProviderRegistry {
  private _providers = new Map<string, LLMProvider>()
  private _defaultProviderId: string | null = null
  private static constructors = new Map<string, ProviderConstructor>()

  static {
    // Register built-in provider constructors
    this.constructors.set('ollama', OllamaProvider as unknown as ProviderConstructor)
    this.constructors.set('claude-cli', ClaudeCliProvider as unknown as ProviderConstructor)
    this.constructors.set('openai', OpenAIProvider as unknown as ProviderConstructor)
    this.constructors.set('anthropic', AnthropicProvider as unknown as ProviderConstructor)
    this.constructors.set('local-llm', LocalLLMProvider as unknown as ProviderConstructor)
  }

  /**
   * Register a provider constructor
   */
  static registerConstructor(name: string, provider: ProviderConstructor): void {
    this.constructors.set(name, provider)
  }

  /**
   * Create a provider instance from constructor registry
   */
  static createProvider(name: string, config?: LLMProviderConfig): LLMProvider {
    const Provider = this.constructors.get(name)
    if (!Provider) {
      throw new Error(`Unknown provider: ${name}`)
    }
    return new Provider(config)
  }

  /**
   * Get list of registered provider types
   */
  static listConstructors(): string[] {
    return Array.from(this.constructors.keys())
  }

  /**
   * Check if a provider type is registered
   */
  static hasConstructor(name: string): boolean {
    return this.constructors.has(name)
  }

  // Instance methods for managing provider instances

  /**
   * Register a provider instance
   */
  async register(provider: LLMProvider): Promise<void> {
    if (!provider.isInitialized) {
      await provider.initialize()
    }
    this._providers.set(provider.id, provider)

    // Set as default if first provider
    if (this._defaultProviderId === null) {
      this._defaultProviderId = provider.id
    }
  }

  /**
   * Unregister a provider by ID
   */
  unregister(providerId: string): boolean {
    const provider = this._providers.get(providerId)
    if (provider) {
      provider.dispose()
      this._providers.delete(providerId)
      if (this._defaultProviderId === providerId) {
        this._defaultProviderId = this._providers.size > 0
          ? this._providers.keys().next().value ?? null
          : null
      }
      return true
    }
    return false
  }

  /**
   * Get a provider by ID
   */
  get(providerId?: string): LLMProvider {
    const id = providerId ?? this._defaultProviderId
    if (!id) {
      throw new Error('No providers registered')
    }

    const provider = this._providers.get(id)
    if (!provider) {
      throw new Error(`Provider ${id} not found`)
    }

    return provider
  }

  /**
   * Get provider by type
   */
  getByType(type: ProviderType): LLMProvider | undefined {
    return Array.from(this._providers.values()).find((p) => p.type === type)
  }

  /**
   * Get all registered providers
   */
  getAll(): LLMProvider[] {
    return Array.from(this._providers.values())
  }

  /**
   * Set default provider
   */
  setDefault(providerId: string): void {
    if (!this._providers.has(providerId)) {
      throw new Error(`Provider ${providerId} not found`)
    }
    this._defaultProviderId = providerId
  }

  /**
   * Get default provider ID
   */
  getDefaultId(): string | null {
    return this._defaultProviderId
  }

  /**
   * Check if provider exists
   */
  has(providerId: string): boolean {
    return this._providers.has(providerId)
  }

  /**
   * Get available providers (that pass health check)
   */
  async getAvailable(): Promise<LLMProvider[]> {
    const available: LLMProvider[] = []
    for (const provider of this._providers.values()) {
      if (await provider.isAvailable()) {
        available.push(provider)
      }
    }
    return available
  }

  /**
   * Dispose all providers
   */
  async disposeAll(): Promise<void> {
    for (const provider of this._providers.values()) {
      await provider.dispose()
    }
    this._providers.clear()
    this._defaultProviderId = null
  }
}

// Global singleton
let globalRegistry: ProviderRegistry | null = null

export function getGlobalRegistry(): ProviderRegistry {
  if (!globalRegistry) {
    globalRegistry = new ProviderRegistry()
  }
  return globalRegistry
}
