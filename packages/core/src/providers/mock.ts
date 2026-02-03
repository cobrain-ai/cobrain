import type {
  LLMCompletionOptions,
  LLMMessage,
  LLMProvider,
  LLMResponse,
  LLMStreamChunk,
  ProviderCapabilities,
  HealthCheckResult,
} from '../types/index.js'
import { BaseProvider } from './base.js'

export interface MockProviderConfig {
  responses?: Map<string, string>
  defaultResponse?: string
  delay?: number
  shouldFail?: boolean
  failMessage?: string
}

/**
 * Mock LLM Provider for testing
 * Provides configurable responses without making actual API calls
 */
export class MockProvider extends BaseProvider implements LLMProvider {
  readonly name = 'Mock'
  readonly type = 'mock' as const
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    functionCalling: false,
    vision: false,
    maxTokens: 4096,
  }

  private responses: Map<string, string>
  private defaultResponse: string
  private delay: number
  private shouldFail: boolean
  private failMessage: string

  constructor(config: MockProviderConfig = {}) {
    super()
    this.responses = config.responses ?? new Map()
    this.defaultResponse =
      config.defaultResponse ?? 'This is a mock response for testing.'
    this.delay = config.delay ?? 0
    this.shouldFail = config.shouldFail ?? false
    this.failMessage = config.failMessage ?? 'Mock provider failure'
  }

  async initialize(): Promise<void> {
    this._isInitialized = true
  }

  async isAvailable(): Promise<boolean> {
    return !this.shouldFail
  }

  async complete(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): Promise<LLMResponse> {
    if (this.shouldFail) {
      throw new Error(this.failMessage)
    }

    if (this.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delay))
    }

    const lastMessage = messages[messages.length - 1]
    const userContent = lastMessage?.content ?? ''

    // Check for configured responses
    let responseContent = this.defaultResponse
    for (const [key, value] of this.responses) {
      if (userContent.toLowerCase().includes(key.toLowerCase())) {
        responseContent = value
        break
      }
    }

    return {
      content: responseContent,
      model: 'mock-model',
      finishReason: 'stop',
      usage: {
        inputTokens: this.estimateTokens(messages),
        outputTokens: this.estimateTokens([
          { role: 'assistant', content: responseContent },
        ]),
      },
    }
  }

  async *stream(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): AsyncGenerator<LLMStreamChunk, LLMResponse> {
    if (this.shouldFail) {
      throw new Error(this.failMessage)
    }

    const response = await this.complete(messages, options)
    const words = response.content.split(' ')

    for (const word of words) {
      if (this.delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.delay / words.length))
      }
      yield {
        content: word + ' ',
        model: 'mock-model',
        finishReason: null,
      }
    }

    return response
  }

  async healthCheck(): Promise<HealthCheckResult> {
    return {
      healthy: !this.shouldFail,
      latency: this.delay,
      message: this.shouldFail ? this.failMessage : 'Mock provider is healthy',
      models: ['mock-model'],
    }
  }

  async dispose(): Promise<void> {
    this._isInitialized = false
  }

  // Helper to estimate tokens (rough approximation)
  private estimateTokens(messages: LLMMessage[]): number {
    return messages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0)
  }

  // Test helpers
  setResponse(trigger: string, response: string): void {
    this.responses.set(trigger, response)
  }

  setDefaultResponse(response: string): void {
    this.defaultResponse = response
  }

  setDelay(delay: number): void {
    this.delay = delay
  }

  setShouldFail(shouldFail: boolean, message?: string): void {
    this.shouldFail = shouldFail
    if (message) this.failMessage = message
  }

  clearResponses(): void {
    this.responses.clear()
  }
}

// Pre-configured mock providers for common test scenarios
export const createMockProvider = {
  /**
   * Create a mock provider that returns entity extraction JSON
   */
  forEntityExtraction(): MockProvider {
    const provider = new MockProvider({
      defaultResponse: JSON.stringify({
        entities: [
          {
            type: 'person',
            value: 'John',
            normalizedValue: 'john',
            confidence: 0.95,
          },
          {
            type: 'date',
            value: 'tomorrow',
            normalizedValue: new Date(Date.now() + 86400000)
              .toISOString()
              .split('T')[0],
            confidence: 0.9,
          },
        ],
      }),
    })
    return provider
  },

  /**
   * Create a mock provider that returns reminder extraction JSON
   */
  forReminderExtraction(): MockProvider {
    const provider = new MockProvider({
      defaultResponse: JSON.stringify({
        reminders: [
          {
            type: 'time',
            message: 'Call John',
            datetime: new Date(Date.now() + 86400000).toISOString(),
            sourceText: 'call John tomorrow',
            isRecurring: false,
            confidence: 0.9,
          },
        ],
      }),
    })
    return provider
  },

  /**
   * Create a mock provider for query processing
   */
  forQuery(): MockProvider {
    const provider = new MockProvider({
      defaultResponse: 'Based on your notes, here is what I found...',
    })
    provider.setResponse('hello', "Hello! I'm your CoBrain assistant.")
    provider.setResponse('hi', "Hi there! How can I help you today?")
    return provider
  },

  /**
   * Create a failing mock provider
   */
  failing(message = 'Mock API error'): MockProvider {
    return new MockProvider({
      shouldFail: true,
      failMessage: message,
    })
  },

  /**
   * Create a slow mock provider for testing timeouts
   */
  slow(delay = 5000): MockProvider {
    return new MockProvider({ delay })
  },
}
