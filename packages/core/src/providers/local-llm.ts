import { BaseProvider } from './base.js'
import type {
  LLMProviderConfig,
  LLMMessage,
  LLMCompletionOptions,
  LLMResponse,
  LLMStreamChunk,
  ProviderType,
  ProviderCapabilities,
  HealthCheckResult,
  LocalLLMBridge,
} from '../types/index.js'
import { generateId } from '../utils/id.js'

/**
 * Local LLM provider for on-device inference on iOS and Android.
 *
 * This provider delegates to a platform-specific bridge:
 * - iOS: Apple Foundation Models (zero download on supported devices)
 * - Android: MediaPipe LLM Inference API (Gemma 3n)
 *
 * The bridge must be injected via `setBridge()` from the mobile app,
 * since native modules are only available in React Native context.
 */
export class LocalLLMProvider extends BaseProvider {
  readonly type: ProviderType = 'local-llm'
  readonly name = 'On-Device AI'
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    functionCalling: false,
    vision: false,
    maxTokens: 2048,
    models: [],
  }

  private static DEFAULT_MODEL = 'auto'
  private bridge: LocalLLMBridge | null = null
  private activeModelId: string | null = null

  constructor(config: LLMProviderConfig = {}) {
    super({
      type: 'local-llm',
      model: LocalLLMProvider.DEFAULT_MODEL,
      ...config,
    })
  }

  /**
   * Inject the platform-specific bridge from the React Native layer.
   * Must be called before initialize().
   */
  setBridge(bridge: LocalLLMBridge): void {
    this.bridge = bridge
  }

  /**
   * Set the active model ID to use for inference.
   */
  setActiveModel(modelId: string): void {
    this.activeModelId = modelId
  }

  getActiveModelId(): string | null {
    return this.activeModelId
  }

  async initialize(): Promise<void> {
    await super.initialize()
    if (this.bridge) {
      try {
        const models = await this.bridge.listDownloadedModels()
        this.capabilities.models = models.map((m) => m.id)
        if (models.length > 0 && !this.activeModelId) {
          this.activeModelId = models[0].id
        }
      } catch {
        // Bridge may not be ready yet
      }
    }
  }

  protected getDefaultModel(): string {
    return this.activeModelId ?? LocalLLMProvider.DEFAULT_MODEL
  }

  async isAvailable(): Promise<boolean> {
    if (!this.bridge) return false
    try {
      return await this.bridge.isAvailable()
    } catch {
      return false
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now()
    if (!this.bridge) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        message: 'No platform bridge configured',
      }
    }

    try {
      const available = await this.bridge.isAvailable()
      const models = await this.bridge.listDownloadedModels()
      return {
        healthy: available && models.length > 0,
        latencyMs: Date.now() - start,
        models: models.map((m) => m.id),
        message: models.length === 0 ? 'No models downloaded' : undefined,
      }
    } catch (error) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private formatPrompt(messages: LLMMessage[]): string {
    return messages
      .map((m) => {
        const content =
          typeof m.content === 'string'
            ? m.content
            : m.content.map((b) => b.text ?? '').join('')
        if (m.role === 'system') return `System: ${content}`
        if (m.role === 'user') return `User: ${content}`
        return `Assistant: ${content}`
      })
      .join('\n\n')
  }

  async complete(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): Promise<LLMResponse> {
    if (!this.bridge) {
      throw new Error('Local LLM bridge not configured')
    }

    const modelId = this.activeModelId
    if (!modelId) {
      throw new Error('No local model selected')
    }

    const start = Date.now()
    const prompt = this.formatPrompt(messages)

    const content = await this.bridge.generate(modelId, prompt, {
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? 2048,
      signal: options?.signal,
    })

    return this.createResponse({
      content,
      model: modelId,
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      },
      finishReason: 'stop',
      latencyMs: Date.now() - start,
    })
  }

  async *stream(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): AsyncIterable<LLMStreamChunk> {
    if (!this.bridge) {
      throw new Error('Local LLM bridge not configured')
    }

    const modelId = this.activeModelId
    if (!modelId) {
      throw new Error('No local model selected')
    }

    const prompt = this.formatPrompt(messages)
    const responseId = generateId()
    let index = 0

    const stream = this.bridge.generateStream(modelId, prompt, {
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? 2048,
      signal: options?.signal,
    })

    for await (const token of stream) {
      yield {
        id: responseId,
        index: index++,
        content: token,
        delta: { text: token },
        done: false,
      }
    }

    yield {
      id: responseId,
      index: index++,
      content: '',
      delta: { text: '' },
      done: true,
      finishReason: 'stop',
    }
  }
}
