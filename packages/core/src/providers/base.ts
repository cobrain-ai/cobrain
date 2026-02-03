import type {
  LLMProvider,
  LLMProviderConfig,
  LLMMessage,
  LLMCompletionOptions,
  LLMResponse,
  LLMStreamChunk,
  ProviderType,
  ProviderCapabilities,
  HealthCheckResult,
} from '../types/index.js'
import { generateId } from '../utils/id.js'

export abstract class BaseProvider implements LLMProvider {
  abstract readonly type: ProviderType
  abstract readonly name: string
  abstract readonly capabilities: ProviderCapabilities

  readonly id: string
  protected _isInitialized = false
  protected config: LLMProviderConfig

  get isInitialized(): boolean {
    return this._isInitialized
  }

  constructor(config: LLMProviderConfig = {}) {
    this.id = `${config.type ?? 'provider'}-${generateId().slice(0, 8)}`
    this.config = config
  }

  async initialize(): Promise<void> {
    this._isInitialized = true
  }

  abstract isAvailable(): Promise<boolean>

  abstract complete(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): Promise<LLMResponse>

  async *stream(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): AsyncIterable<LLMStreamChunk> {
    // Default implementation: fall back to non-streaming
    const result = await this.complete(messages, options)
    yield {
      id: result.id,
      index: 0,
      content: result.content,
      delta: { text: result.content },
      done: true,
      finishReason: result.finishReason,
    }
  }

  abstract healthCheck(): Promise<HealthCheckResult>

  async dispose(): Promise<void> {
    this._isInitialized = false
  }

  protected getModel(): string {
    return this.config.model ?? this.getDefaultModel()
  }

  protected abstract getDefaultModel(): string

  protected getTimeout(): number {
    return this.config.timeout ?? 30000
  }

  protected assertInitialized(): void {
    if (!this._isInitialized) {
      throw new Error('Provider not initialized')
    }
  }

  protected createResponse(
    partial: Partial<LLMResponse> & { content: string; model: string }
  ): LLMResponse {
    return {
      id: partial.id ?? generateId(),
      provider: this.type,
      model: partial.model,
      content: partial.content,
      contentBlocks: partial.contentBlocks,
      usage: partial.usage ?? { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      finishReason: partial.finishReason ?? 'stop',
      latencyMs: partial.latencyMs ?? 0,
    }
  }
}
