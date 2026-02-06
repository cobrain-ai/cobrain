import type {
  LLMProvider,
  ProviderConfig,
  OllamaConfig,
  ClaudeCliConfig,
  OpenAIConfig,
  AnthropicConfig,
  LocalLLMConfig,
} from '../types/index.js'
import { OllamaProvider } from './ollama.js'
import { ClaudeCliProvider } from './claude-cli.js'
import { OpenAIProvider } from './openai.js'
import { AnthropicProvider } from './anthropic.js'
import { LocalLLMProvider } from './local-llm.js'

export class ProviderFactory {
  /**
   * Create a provider from configuration
   */
  static create(config: ProviderConfig): LLMProvider {
    switch (config.type) {
      case 'ollama':
        return new OllamaProvider(config as OllamaConfig)
      case 'claude-cli':
        return new ClaudeCliProvider(config as ClaudeCliConfig)
      case 'openai':
        return new OpenAIProvider(config as OpenAIConfig)
      case 'anthropic':
        return new AnthropicProvider(config as AnthropicConfig)
      case 'local-llm':
        return new LocalLLMProvider(config as LocalLLMConfig)
      default:
        throw new Error(`Unknown provider type: ${(config as ProviderConfig).type}`)
    }
  }

  /**
   * Create and initialize a provider
   */
  static async createAndInit(config: ProviderConfig): Promise<LLMProvider> {
    const provider = ProviderFactory.create(config)
    await provider.initialize()
    return provider
  }

  /**
   * Create Ollama provider with defaults
   */
  static ollama(config: Partial<OllamaConfig> = {}): OllamaProvider {
    return new OllamaProvider({
      type: 'ollama',
      enabled: true,
      baseUrl: 'http://localhost:11434',
      defaultModel: 'llama3:8b',
      ...config,
    })
  }

  /**
   * Create Claude CLI provider with defaults
   */
  static claudeCli(config: Partial<ClaudeCliConfig> = {}): ClaudeCliProvider {
    return new ClaudeCliProvider({
      type: 'claude-cli',
      enabled: true,
      cliPath: 'claude',
      ...config,
    })
  }

  /**
   * Create OpenAI provider
   */
  static openai(apiKey: string, config: Partial<OpenAIConfig> = {}): OpenAIProvider {
    return new OpenAIProvider({
      type: 'openai',
      enabled: true,
      apiKey,
      model: 'gpt-4o',
      ...config,
    })
  }

  /**
   * Create Anthropic provider
   */
  static anthropic(apiKey: string, config: Partial<AnthropicConfig> = {}): AnthropicProvider {
    return new AnthropicProvider({
      type: 'anthropic',
      enabled: true,
      apiKey,
      model: 'claude-sonnet-4-20250514',
      ...config,
    })
  }

  /**
   * Create Local LLM provider for on-device inference
   */
  static localLLM(config: Partial<LocalLLMConfig> = {}): LocalLLMProvider {
    return new LocalLLMProvider({
      type: 'local-llm',
      enabled: true,
      ...config,
    })
  }
}
