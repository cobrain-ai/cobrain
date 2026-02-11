import { describe, it, expect, beforeEach } from 'vitest'
import { MockProvider, createMockProvider } from './mock.js'

describe('MockProvider', () => {
  let provider: MockProvider

  beforeEach(() => {
    provider = new MockProvider()
  })

  describe('constructor', () => {
    it('should create with default configuration', () => {
      expect(provider.name).toBe('Mock')
      // MockProvider uses 'ollama' as type for compatibility
      expect(provider.type).toBe('ollama')
    })

    it('should accept custom default response', () => {
      const custom = new MockProvider({
        defaultResponse: 'Custom response',
      })
      expect(custom).toBeDefined()
    })
  })

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await provider.initialize()
      expect(provider.isInitialized).toBe(true)
    })
  })

  describe('isAvailable', () => {
    it('should return true when not configured to fail', async () => {
      const available = await provider.isAvailable()
      expect(available).toBe(true)
    })

    it('should return false when configured to fail', async () => {
      provider.setShouldFail(true)
      const available = await provider.isAvailable()
      expect(available).toBe(false)
    })
  })

  describe('complete', () => {
    it('should return default response', async () => {
      const response = await provider.complete([
        { role: 'user', content: 'Hello' },
      ])

      expect(response.content).toBe('This is a mock response for testing.')
      expect(response.model).toBe('mock-model')
      expect(response.finishReason).toBe('stop')
    })

    it('should return configured response for trigger', async () => {
      provider.setResponse('greeting', 'Hello there!')

      const response = await provider.complete([
        { role: 'user', content: 'Send a greeting' },
      ])

      expect(response.content).toBe('Hello there!')
    })

    it('should include token usage', async () => {
      const response = await provider.complete([
        { role: 'user', content: 'Test message' },
      ])

      expect(response.usage.inputTokens).toBeGreaterThan(0)
      expect(response.usage.outputTokens).toBeGreaterThan(0)
    })

    it('should throw when configured to fail', async () => {
      provider.setShouldFail(true, 'Test failure')

      await expect(
        provider.complete([{ role: 'user', content: 'Hi' }])
      ).rejects.toThrow('Test failure')
    })

    it('should respect delay configuration', async () => {
      provider.setDelay(100)
      const start = Date.now()

      await provider.complete([{ role: 'user', content: 'Hi' }])

      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(90) // Allow small variance
    })
  })

  describe('stream', () => {
    it('should yield chunks', async () => {
      const chunks: string[] = []

      const generator = provider.stream([{ role: 'user', content: 'Hi' }])

      for await (const chunk of generator) {
        chunks.push(chunk.content)
      }

      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks.join('')).toContain('mock response')
    })

    it('should throw when configured to fail', async () => {
      provider.setShouldFail(true, 'Stream failure')

      const generator = provider.stream([{ role: 'user', content: 'Hi' }])

      await expect(async () => {
        for await (const _ of generator) {
          // consume generator
        }
      }).rejects.toThrow('Stream failure')
    })
  })

  describe('healthCheck', () => {
    it('should return healthy when not failing', async () => {
      const health = await provider.healthCheck()

      expect(health.healthy).toBe(true)
      expect(health.models).toContain('mock-model')
    })

    it('should return unhealthy when failing', async () => {
      provider.setShouldFail(true, 'Health check fail')
      const health = await provider.healthCheck()

      expect(health.healthy).toBe(false)
      expect(health.message).toBe('Health check fail')
    })
  })

  describe('test helpers', () => {
    it('should allow setting responses', () => {
      provider.setResponse('test', 'Test response')
      expect(provider).toBeDefined()
    })

    it('should allow clearing responses', () => {
      provider.setResponse('test', 'Test response')
      provider.clearResponses()
      expect(provider).toBeDefined()
    })
  })
})

describe('createMockProvider', () => {
  it('should create provider for entity extraction', () => {
    const provider = createMockProvider.forEntityExtraction()
    expect(provider).toBeInstanceOf(MockProvider)
  })

  it('should create provider for reminder extraction', () => {
    const provider = createMockProvider.forReminderExtraction()
    expect(provider).toBeInstanceOf(MockProvider)
  })

  it('should create provider for queries', () => {
    const provider = createMockProvider.forQuery()
    expect(provider).toBeInstanceOf(MockProvider)
  })

  it('should create failing provider', () => {
    const provider = createMockProvider.failing('Custom error')
    expect(provider).toBeInstanceOf(MockProvider)
  })

  it('should create slow provider', () => {
    const provider = createMockProvider.slow(1000)
    expect(provider).toBeInstanceOf(MockProvider)
  })

  describe('forEntityExtraction', () => {
    it('should return valid entity JSON', async () => {
      const provider = createMockProvider.forEntityExtraction()
      const response = await provider.complete([
        { role: 'user', content: 'Extract entities from: Meeting with John tomorrow' },
      ])

      const parsed = JSON.parse(response.content)
      expect(parsed.entities).toBeDefined()
      expect(Array.isArray(parsed.entities)).toBe(true)
    })
  })

  describe('forReminderExtraction', () => {
    it('should return valid reminder JSON', async () => {
      const provider = createMockProvider.forReminderExtraction()
      const response = await provider.complete([
        { role: 'user', content: 'Extract reminders from: Call John tomorrow' },
      ])

      const parsed = JSON.parse(response.content)
      expect(parsed.reminders).toBeDefined()
      expect(Array.isArray(parsed.reminders)).toBe(true)
    })
  })
})
