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
} from '../types/index.js'
import { generateId } from '../utils/id.js'

interface OllamaResponse {
  model: string
  message: {
    role: string
    content: string
  }
  done: boolean
  total_duration?: number
  prompt_eval_count?: number
  eval_count?: number
}

interface OllamaTagsResponse {
  models: Array<{ name: string }>
}

export class OllamaProvider extends BaseProvider {
  readonly type: ProviderType = 'ollama'
  readonly name = 'Ollama'
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    functionCalling: false,
    vision: true,
    maxTokens: 4096,
    models: [],
  }

  private static readonly DEFAULT_BASE_URL = 'http://localhost:11434'
  private static readonly DEFAULT_MODEL = 'llama3:8b'

  constructor(config: LLMProviderConfig = {}) {
    super({
      type: 'ollama',
      baseUrl: OllamaProvider.DEFAULT_BASE_URL,
      model: OllamaProvider.DEFAULT_MODEL,
      ...config,
    })
  }

  private formatMessages(messages: LLMMessage[]): Array<{ role: string; content: string }> {
    return messages.map((m) => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : m.content.map((b) => b.text).join(''),
    }))
  }

  private buildRequestOptions(options?: LLMCompletionOptions): Record<string, unknown> {
    return {
      temperature: options?.temperature ?? 0.7,
      num_predict: options?.maxTokens ?? 2048,
      top_p: options?.topP,
      stop: options?.stop,
    }
  }

  async initialize(): Promise<void> {
    await super.initialize()
    // Fetch available models
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })
      if (response.ok) {
        const data = (await response.json()) as OllamaTagsResponse
        this.capabilities.models = data.models.map((m) => m.name)
      }
    } catch {
      // Keep empty models list
    }
  }

  protected getDefaultModel(): string {
    return OllamaProvider.DEFAULT_MODEL
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })
      return response.ok
    } catch {
      return false
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now()
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })
      const latencyMs = Date.now() - start
      if (response.ok) {
        const data = (await response.json()) as OllamaTagsResponse
        return {
          healthy: true,
          latencyMs,
          models: data.models.map((m) => m.name),
        }
      }
      return {
        healthy: false,
        latencyMs,
        message: `HTTP ${response.status}`,
      }
    } catch (error) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async complete(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): Promise<LLMResponse> {
    const start = Date.now()
    const model = options?.model ?? this.getModel()

    const response = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: this.formatMessages(messages),
        stream: false,
        options: this.buildRequestOptions(options),
      }),
      signal: options?.signal ?? AbortSignal.timeout(this.getTimeout()),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }

    const data = (await response.json()) as OllamaResponse
    const inputTokens = data.prompt_eval_count ?? 0
    const outputTokens = data.eval_count ?? 0

    return this.createResponse({
      content: data.message.content,
      model: data.model,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
      finishReason: 'stop',
      latencyMs: Date.now() - start,
    })
  }

  async *stream(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): AsyncIterable<LLMStreamChunk> {
    const model = options?.model ?? this.getModel()
    const responseId = generateId()

    const response = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: this.formatMessages(messages),
        stream: true,
        options: this.buildRequestOptions(options),
      }),
      signal: options?.signal ?? AbortSignal.timeout(this.getTimeout()),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let index = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.trim()) continue
        const data = JSON.parse(line) as OllamaResponse
        yield {
          id: responseId,
          index: index++,
          content: data.message.content,
          delta: { text: data.message.content },
          done: data.done,
          finishReason: data.done ? 'stop' : undefined,
        }
      }
    }
  }
}
