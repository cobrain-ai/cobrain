import type {
  LLMProvider,
  LLMProviderConfig,
  LLMMessage,
  LLMCompletionOptions,
  LLMCompletionResult,
  LLMStreamChunk,
} from '../types/index.js'

export abstract class BaseProvider implements LLMProvider {
  abstract name: string
  protected config: LLMProviderConfig

  constructor(config: LLMProviderConfig = {}) {
    this.config = config
  }

  abstract isAvailable(): Promise<boolean>

  abstract complete(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): Promise<LLMCompletionResult>

  async *stream(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): AsyncIterable<LLMStreamChunk> {
    // Default implementation: fall back to non-streaming
    const result = await this.complete(messages, options)
    yield { content: result.content, done: true }
  }

  protected getModel(): string {
    return this.config.model ?? this.getDefaultModel()
  }

  protected abstract getDefaultModel(): string

  protected getTimeout(): number {
    return this.config.timeout ?? 30000
  }
}
