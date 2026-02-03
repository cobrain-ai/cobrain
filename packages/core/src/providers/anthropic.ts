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
  AnthropicConfig,
} from '../types/index.js'
import { generateId } from '../utils/id.js'

interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AnthropicResponse {
  id: string
  type: 'message'
  role: 'assistant'
  content: Array<{
    type: 'text'
    text: string
  }>
  model: string
  stop_reason: string
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

interface AnthropicStreamEvent {
  type: string
  message?: AnthropicResponse
  index?: number
  content_block?: {
    type: string
    text: string
  }
  delta?: {
    type: string
    text?: string
    stop_reason?: string
  }
}

export class AnthropicProvider extends BaseProvider {
  readonly type: ProviderType = 'anthropic'
  readonly name = 'Anthropic'
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    functionCalling: true,
    vision: true,
    maxTokens: 200000,
    models: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-3-5-sonnet-20241022'],
  }

  private apiKey: string
  private baseUrl: string

  constructor(config: Partial<AnthropicConfig> & { apiKey: string }) {
    super({
      type: 'anthropic',
      ...config,
    })
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl ?? 'https://api.anthropic.com'
  }

  async initialize(): Promise<void> {
    await super.initialize()
    // Validate API key format (Anthropic keys start with sk-ant-)
    if (!this.apiKey) {
      throw new Error('Anthropic API key is required')
    }
  }

  protected getDefaultModel(): string {
    return 'claude-sonnet-4-20250514'
  }

  async isAvailable(): Promise<boolean> {
    // Anthropic doesn't have a simple health endpoint, so we just validate config
    return !!this.apiKey
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now()
    // Simple validation - we can't easily check without making a billable request
    if (!this.apiKey) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        message: 'API key not configured',
      }
    }
    return {
      healthy: true,
      latencyMs: Date.now() - start,
      message: 'API key configured',
      models: this.capabilities.models,
    }
  }

  async complete(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): Promise<LLMResponse> {
    const start = Date.now()
    const model = options?.model ?? this.getModel()

    // Extract system message and convert to Anthropic format
    const { systemPrompt, anthropicMessages } = this.convertMessages(messages)

    const requestBody: Record<string, unknown> = {
      model,
      messages: anthropicMessages,
      max_tokens: options?.maxTokens ?? 4096,
    }

    if (systemPrompt) {
      requestBody.system = systemPrompt
    }
    if (options?.temperature !== undefined) {
      requestBody.temperature = options.temperature
    }
    if (options?.topP !== undefined) {
      requestBody.top_p = options.topP
    }
    if (options?.stop) {
      requestBody.stop_sequences = options.stop
    }

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
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
      throw new Error(`Anthropic API error: ${response.status} - ${error.error?.message ?? 'Unknown error'}`)
    }

    const data = (await response.json()) as AnthropicResponse
    const latencyMs = Date.now() - start

    const content = data.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')

    return this.createResponse({
      id: data.id,
      content,
      model: data.model,
      usage: {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      finishReason: this.mapStopReason(data.stop_reason),
      latencyMs,
    })
  }

  async *stream(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): AsyncIterable<LLMStreamChunk> {
    const model = options?.model ?? this.getModel()

    // Extract system message and convert to Anthropic format
    const { systemPrompt, anthropicMessages } = this.convertMessages(messages)

    const requestBody: Record<string, unknown> = {
      model,
      messages: anthropicMessages,
      max_tokens: options?.maxTokens ?? 4096,
      stream: true,
    }

    if (systemPrompt) {
      requestBody.system = systemPrompt
    }
    if (options?.temperature !== undefined) {
      requestBody.temperature = options.temperature
    }
    if (options?.topP !== undefined) {
      requestBody.top_p = options.topP
    }
    if (options?.stop) {
      requestBody.stop_sequences = options.stop
    }

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
      signal: options?.signal ?? AbortSignal.timeout(this.getTimeout()),
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let index = 0
    let responseId = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue

        try {
          const event = JSON.parse(trimmed.slice(6)) as AnthropicStreamEvent

          if (event.type === 'message_start' && event.message) {
            responseId = event.message.id
          } else if (event.type === 'content_block_delta' && event.delta?.text) {
            yield {
              id: responseId || generateId(),
              index: index++,
              content: event.delta.text,
              delta: { text: event.delta.text },
              done: false,
            }
          } else if (event.type === 'message_delta' && event.delta?.stop_reason) {
            yield {
              id: responseId || generateId(),
              index: index++,
              content: '',
              done: true,
              finishReason: this.mapStopReason(event.delta.stop_reason),
            }
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }

  private convertMessages(messages: LLMMessage[]): {
    systemPrompt: string | undefined
    anthropicMessages: AnthropicMessage[]
  } {
    let systemPrompt: string | undefined
    const anthropicMessages: AnthropicMessage[] = []

    for (const msg of messages) {
      const content = typeof msg.content === 'string'
        ? msg.content
        : msg.content.map((b) => b.text).join('')

      if (msg.role === 'system') {
        systemPrompt = content
      } else {
        anthropicMessages.push({
          role: msg.role as 'user' | 'assistant',
          content,
        })
      }
    }

    return { systemPrompt, anthropicMessages }
  }

  private mapStopReason(reason: string): 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'error' {
    switch (reason) {
      case 'end_turn':
      case 'stop_sequence':
        return 'stop'
      case 'max_tokens':
        return 'length'
      case 'tool_use':
        return 'tool_calls'
      default:
        return 'stop'
    }
  }
}
