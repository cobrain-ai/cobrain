import type { LLMProvider, LLMProviderConfig } from '../types/index.js'
import { OllamaProvider } from './ollama.js'

type ProviderConstructor = new (config?: LLMProviderConfig) => LLMProvider

export class ProviderRegistry {
  private static providers = new Map<string, ProviderConstructor>()
  private static instances = new Map<string, LLMProvider>()

  static {
    // Register built-in providers
    this.register('ollama', OllamaProvider)
  }

  static register(name: string, provider: ProviderConstructor): void {
    this.providers.set(name, provider)
  }

  static get(name: string, config?: LLMProviderConfig): LLMProvider {
    const cached = this.instances.get(name)
    if (cached && !config) {
      return cached
    }

    const Provider = this.providers.get(name)
    if (!Provider) {
      throw new Error(`Unknown provider: ${name}`)
    }

    const instance = new Provider(config)
    if (!config) {
      this.instances.set(name, instance)
    }
    return instance
  }

  static has(name: string): boolean {
    return this.providers.has(name)
  }

  static list(): string[] {
    return Array.from(this.providers.keys())
  }

  static async getAvailable(): Promise<LLMProvider[]> {
    const available: LLMProvider[] = []
    for (const name of this.providers.keys()) {
      const provider = this.get(name)
      if (await provider.isAvailable()) {
        available.push(provider)
      }
    }
    return available
  }
}
