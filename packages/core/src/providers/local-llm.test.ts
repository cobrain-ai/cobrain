import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LocalLLMProvider } from './local-llm.js'
import type { LocalLLMBridge, DownloadedModel, LocalModel, ModelDownloadProgress } from '../types/index.js'

function createMockBridge(overrides: Partial<LocalLLMBridge> = {}): LocalLLMBridge {
  return {
    isAvailable: vi.fn().mockResolvedValue(true),
    listDownloadedModels: vi.fn().mockResolvedValue([
      {
        id: 'test-model',
        name: 'Test Model',
        description: 'A test model',
        parameters: '2B',
        sizeBytes: 1_500_000_000,
        downloadUrl: 'https://example.com/model',
        platform: 'both',
        quality: 'good',
        speed: 'fast',
        localPath: '/models/test-model',
        downloadedAt: new Date(),
      } satisfies DownloadedModel,
    ]),
    downloadModel: vi.fn(),
    deleteModel: vi.fn(),
    cancelDownload: vi.fn(),
    generate: vi.fn().mockResolvedValue('This is a test response from local LLM.'),
    generateStream: vi.fn().mockImplementation(async function* () {
      yield 'Hello '
      yield 'from '
      yield 'local '
      yield 'LLM!'
    }),
    ...overrides,
  }
}

describe('LocalLLMProvider', () => {
  let provider: LocalLLMProvider

  beforeEach(() => {
    provider = new LocalLLMProvider()
  })

  describe('constructor', () => {
    it('should create with default configuration', () => {
      expect(provider.name).toBe('On-Device AI')
      expect(provider.type).toBe('local-llm')
    })

    it('should have correct capabilities', () => {
      expect(provider.capabilities.streaming).toBe(true)
      expect(provider.capabilities.functionCalling).toBe(false)
      expect(provider.capabilities.vision).toBe(false)
      expect(provider.capabilities.maxTokens).toBe(2048)
    })
  })

  describe('initialize', () => {
    it('should initialize without bridge', async () => {
      await provider.initialize()
      expect(provider.isInitialized).toBe(true)
    })

    it('should discover models from bridge on initialize', async () => {
      const bridge = createMockBridge()
      provider.setBridge(bridge)
      await provider.initialize()

      expect(provider.isInitialized).toBe(true)
      expect(provider.capabilities.models).toContain('test-model')
      expect(provider.getActiveModelId()).toBe('test-model')
    })

    it('should handle bridge errors gracefully during init', async () => {
      const bridge = createMockBridge({
        listDownloadedModels: vi.fn().mockRejectedValue(new Error('Bridge error')),
      })
      provider.setBridge(bridge)
      await provider.initialize()

      expect(provider.isInitialized).toBe(true)
      expect(provider.capabilities.models).toEqual([])
    })
  })

  describe('isAvailable', () => {
    it('should return false without bridge', async () => {
      const available = await provider.isAvailable()
      expect(available).toBe(false)
    })

    it('should delegate to bridge', async () => {
      const bridge = createMockBridge()
      provider.setBridge(bridge)

      const available = await provider.isAvailable()
      expect(available).toBe(true)
      expect(bridge.isAvailable).toHaveBeenCalled()
    })

    it('should return false when bridge throws', async () => {
      const bridge = createMockBridge({
        isAvailable: vi.fn().mockRejectedValue(new Error('Bridge error')),
      })
      provider.setBridge(bridge)

      const available = await provider.isAvailable()
      expect(available).toBe(false)
    })
  })

  describe('healthCheck', () => {
    it('should return unhealthy without bridge', async () => {
      const health = await provider.healthCheck()
      expect(health.healthy).toBe(false)
      expect(health.message).toBe('No platform bridge configured')
    })

    it('should return healthy when bridge is ready with models', async () => {
      const bridge = createMockBridge()
      provider.setBridge(bridge)

      const health = await provider.healthCheck()
      expect(health.healthy).toBe(true)
      expect(health.models).toContain('test-model')
    })

    it('should return unhealthy when no models downloaded', async () => {
      const bridge = createMockBridge({
        listDownloadedModels: vi.fn().mockResolvedValue([]),
      })
      provider.setBridge(bridge)

      const health = await provider.healthCheck()
      expect(health.healthy).toBe(false)
      expect(health.message).toBe('No models downloaded')
    })

    it('should handle bridge errors in health check', async () => {
      const bridge = createMockBridge({
        isAvailable: vi.fn().mockRejectedValue(new Error('Connection error')),
      })
      provider.setBridge(bridge)

      const health = await provider.healthCheck()
      expect(health.healthy).toBe(false)
      expect(health.message).toBe('Connection error')
    })
  })

  describe('complete', () => {
    it('should throw without bridge', async () => {
      provider.setActiveModel('test-model')
      await expect(
        provider.complete([{ role: 'user', content: 'Hello' }])
      ).rejects.toThrow('Local LLM bridge not configured')
    })

    it('should throw without active model', async () => {
      const bridge = createMockBridge()
      provider.setBridge(bridge)

      await expect(
        provider.complete([{ role: 'user', content: 'Hello' }])
      ).rejects.toThrow('No local model selected')
    })

    it('should generate response via bridge', async () => {
      const bridge = createMockBridge()
      provider.setBridge(bridge)
      provider.setActiveModel('test-model')

      const response = await provider.complete([
        { role: 'user', content: 'Hello' },
      ])

      expect(response.content).toBe('This is a test response from local LLM.')
      expect(response.model).toBe('test-model')
      expect(response.provider).toBe('local-llm')
      expect(response.finishReason).toBe('stop')
      expect(response.latencyMs).toBeGreaterThanOrEqual(0)
    })

    it('should format messages correctly', async () => {
      const bridge = createMockBridge()
      provider.setBridge(bridge)
      provider.setActiveModel('test-model')

      await provider.complete([
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' },
        { role: 'user', content: 'How are you?' },
      ])

      expect(bridge.generate).toHaveBeenCalledWith(
        'test-model',
        expect.stringContaining('System: You are helpful.'),
        expect.any(Object)
      )
      expect(bridge.generate).toHaveBeenCalledWith(
        'test-model',
        expect.stringContaining('User: Hello'),
        expect.any(Object)
      )
    })

    it('should pass options to bridge', async () => {
      const bridge = createMockBridge()
      provider.setBridge(bridge)
      provider.setActiveModel('test-model')

      await provider.complete(
        [{ role: 'user', content: 'Hello' }],
        { temperature: 0.5, maxTokens: 1024 }
      )

      expect(bridge.generate).toHaveBeenCalledWith(
        'test-model',
        expect.any(String),
        expect.objectContaining({ temperature: 0.5, maxTokens: 1024 })
      )
    })

    it('should handle content blocks in messages', async () => {
      const bridge = createMockBridge()
      provider.setBridge(bridge)
      provider.setActiveModel('test-model')

      await provider.complete([
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Hello ' },
            { type: 'text', text: 'world' },
          ],
        },
      ])

      expect(bridge.generate).toHaveBeenCalledWith(
        'test-model',
        expect.stringContaining('Hello world'),
        expect.any(Object)
      )
    })
  })

  describe('stream', () => {
    it('should throw without bridge', async () => {
      provider.setActiveModel('test-model')
      const generator = provider.stream([{ role: 'user', content: 'Hi' }])

      await expect(async () => {
        for await (const _ of generator) {
          // consume
        }
      }).rejects.toThrow('Local LLM bridge not configured')
    })

    it('should throw without active model', async () => {
      const bridge = createMockBridge()
      provider.setBridge(bridge)
      const generator = provider.stream([{ role: 'user', content: 'Hi' }])

      await expect(async () => {
        for await (const _ of generator) {
          // consume
        }
      }).rejects.toThrow('No local model selected')
    })

    it('should yield streaming chunks', async () => {
      const bridge = createMockBridge()
      provider.setBridge(bridge)
      provider.setActiveModel('test-model')

      const chunks: string[] = []
      const generator = provider.stream([{ role: 'user', content: 'Hi' }])

      for await (const chunk of generator) {
        if (chunk.content) chunks.push(chunk.content)
      }

      expect(chunks).toEqual(['Hello ', 'from ', 'local ', 'LLM!'])
    })

    it('should emit done chunk at end', async () => {
      const bridge = createMockBridge()
      provider.setBridge(bridge)
      provider.setActiveModel('test-model')

      const allChunks: Array<{ done: boolean; finishReason?: string }> = []
      const generator = provider.stream([{ role: 'user', content: 'Hi' }])

      for await (const chunk of generator) {
        allChunks.push({ done: chunk.done, finishReason: chunk.finishReason })
      }

      const lastChunk = allChunks[allChunks.length - 1]
      expect(lastChunk.done).toBe(true)
      expect(lastChunk.finishReason).toBe('stop')
    })

    it('should have incrementing index', async () => {
      const bridge = createMockBridge()
      provider.setBridge(bridge)
      provider.setActiveModel('test-model')

      const indices: number[] = []
      const generator = provider.stream([{ role: 'user', content: 'Hi' }])

      for await (const chunk of generator) {
        indices.push(chunk.index)
      }

      for (let i = 1; i < indices.length; i++) {
        expect(indices[i]).toBe(indices[i - 1] + 1)
      }
    })
  })

  describe('model management', () => {
    it('should set and get active model', () => {
      expect(provider.getActiveModelId()).toBeNull()
      provider.setActiveModel('my-model')
      expect(provider.getActiveModelId()).toBe('my-model')
    })

    it('should auto-select first model on initialize', async () => {
      const bridge = createMockBridge()
      provider.setBridge(bridge)
      await provider.initialize()

      expect(provider.getActiveModelId()).toBe('test-model')
    })

    it('should not override manually set model on initialize', async () => {
      const bridge = createMockBridge()
      provider.setBridge(bridge)
      provider.setActiveModel('custom-model')
      await provider.initialize()

      expect(provider.getActiveModelId()).toBe('custom-model')
    })
  })

  describe('dispose', () => {
    it('should reset initialization state', async () => {
      await provider.initialize()
      expect(provider.isInitialized).toBe(true)

      await provider.dispose()
      expect(provider.isInitialized).toBe(false)
    })
  })
})
