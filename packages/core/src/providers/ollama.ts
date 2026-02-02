import { BaseProvider } from './base.js'
import type {
  LLMProviderConfig,
  LLMMessage,
  LLMCompletionOptions,
  LLMCompletionResult,
  LLMStreamChunk,
} from '../types/index.js'

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

export class OllamaProvider extends BaseProvider {
  name = 'ollama'

  constructor(config: LLMProviderConfig = {}) {
    super({
      baseUrl: 'http://localhost:11434',
      model: 'llama3:8b',
      ...config,
    })
  }

  protected getDefaultModel(): string {
    return 'llama3:8b'
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

  async complete(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): Promise<LLMCompletionResult> {
    const response = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.getModel(),
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 2048,
          top_p: options?.topP,
          stop: options?.stop,
        },
      }),
      signal: AbortSignal.timeout(this.getTimeout()),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }

    const data = (await response.json()) as OllamaResponse

    return {
      content: data.message.content,
      model: data.model,
      usage: {
        promptTokens: data.prompt_eval_count ?? 0,
        completionTokens: data.eval_count ?? 0,
        totalTokens: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0),
      },
      finishReason: 'stop',
    }
  }

  async *stream(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): AsyncIterable<LLMStreamChunk> {
    const response = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.getModel(),
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 2048,
          top_p: options?.topP,
          stop: options?.stop,
        },
      }),
      signal: AbortSignal.timeout(this.getTimeout()),
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
          content: data.message.content,
          done: data.done,
        }
      }
    }
  }
}
