import { BaseProvider } from './base.js'
import type {
  LLMMessage,
  LLMCompletionOptions,
  LLMResponse,
  LLMStreamChunk,
  ProviderType,
  ProviderCapabilities,
  HealthCheckResult,
  OpenAIConfig,
} from '../types/index.js'
import { generateId } from '../utils/id.js'

interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenAIChatResponse {
  id: string
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model: string
}

interface OpenAIStreamChunk {
  id: string
  choices: Array<{
    delta: {
      content?: string
    }
    finish_reason: string | null
  }>
}

export class OpenAIProvider extends BaseProvider {
  readonly type: ProviderType = 'openai'
  readonly name = 'OpenAI'
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    functionCalling: true,
    vision: true,
    maxTokens: 128000,
    models: ['gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini'],
  }

  private apiKey: string
  private baseUrl: string

  constructor(config: Partial<OpenAIConfig> & { apiKey: string }) {
    super({
      type: 'openai',
      ...config,
    })
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl ?? 'https://api.openai.com/v1'
  }

  async initialize(): Promise<void> {
    await super.initialize()
    // Validate API key format
    if (!this.apiKey || !this.apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key format')
    }
  }

  protected getDefaultModel(): string {
    return 'gpt-4o'
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
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
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        signal: AbortSignal.timeout(5000),
      })
      const latencyMs = Date.now() - start

      if (response.ok) {
        const data = await response.json()
        const models = data.data?.map((m: { id: string }) => m.id) ?? []
        return {
          healthy: true,
          latencyMs,
          models,
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

    const openaiMessages: OpenAIChatMessage[] = messages.map((m) => ({
      role: m.role,
      content: typeof m.content === 'string'
        ? m.content
        : m.content.map((b) => b.text).join(''),
    }))

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: openaiMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        stop: options?.stop,
      }),
      signal: options?.signal ?? AbortSignal.timeout(this.getTimeout()),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      if (response.status === 401) {
        throw new Error('Authentication failed: Invalid API key')
      }
      if (response.status === 429) {
        throw new Error('Rate limited: Too many requests')
      }
      throw new Error(`OpenAI API error: ${response.status} - ${error.error?.message ?? 'Unknown error'}`)
    }

    const data = (await response.json()) as OpenAIChatResponse
    const latencyMs = Date.now() - start

    return this.createResponse({
      id: data.id,
      content: data.choices[0]?.message.content ?? '',
      model: data.model,
      usage: {
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      finishReason: this.mapFinishReason(data.choices[0]?.finish_reason),
      latencyMs,
    })
  }

  async *stream(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): AsyncIterable<LLMStreamChunk> {
    const model = options?.model ?? this.getModel()
    const responseId = generateId()

    const openaiMessages: OpenAIChatMessage[] = messages.map((m) => ({
      role: m.role,
      content: typeof m.content === 'string'
        ? m.content
        : m.content.map((b) => b.text).join(''),
    }))

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: openaiMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        stop: options?.stop,
        stream: true,
      }),
      signal: options?.signal ?? AbortSignal.timeout(this.getTimeout()),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
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
        const trimmed = line.trim()
        if (!trimmed || trimmed === 'data: [DONE]') continue
        if (!trimmed.startsWith('data: ')) continue

        try {
          const data = JSON.parse(trimmed.slice(6)) as OpenAIStreamChunk
          const choice = data.choices[0]
          const content = choice?.delta?.content ?? ''

          yield {
            id: data.id ?? responseId,
            index: index++,
            content,
            delta: { text: content },
            done: choice?.finish_reason !== null,
            finishReason: choice?.finish_reason
              ? this.mapFinishReason(choice.finish_reason)
              : undefined,
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }

  private mapFinishReason(reason: string | null): 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'error' {
    switch (reason) {
      case 'stop':
        return 'stop'
      case 'length':
        return 'length'
      case 'content_filter':
        return 'content_filter'
      case 'tool_calls':
      case 'function_call':
        return 'tool_calls'
      default:
        return 'stop'
    }
  }
}
