import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OllamaProvider } from './ollama.js'

describe('OllamaProvider', () => {
  let provider: OllamaProvider

  beforeEach(() => {
    provider = new OllamaProvider({
      baseUrl: 'http://localhost:11434',
      model: 'llama3:8b',
    })
  })

  describe('constructor', () => {
    it('should use default values when no config provided', () => {
      const defaultProvider = new OllamaProvider()
      expect(defaultProvider.name).toBe('Ollama')
      expect(defaultProvider.type).toBe('ollama')
    })

    it('should accept custom configuration', () => {
      const customProvider = new OllamaProvider({
        baseUrl: 'http://custom:1234',
        model: 'custom-model',
      })
      expect(customProvider.type).toBe('ollama')
    })
  })

  describe('capabilities', () => {
    it('should have correct capabilities', () => {
      expect(provider.capabilities.streaming).toBe(true)
      expect(provider.capabilities.functionCalling).toBe(false)
      expect(provider.capabilities.vision).toBe(true)
    })
  })

  describe('isAvailable', () => {
    it('should return false when fetch fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
      const available = await provider.isAvailable()
      expect(available).toBe(false)
      vi.unstubAllGlobals()
    })

    it('should return true when API responds OK', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: [] }),
      }))
      const available = await provider.isAvailable()
      expect(available).toBe(true)
      vi.unstubAllGlobals()
    })
  })

  describe('healthCheck', () => {
    it('should return healthy status when API is available', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: [{ name: 'llama3:8b' }] }),
      }))

      const health = await provider.healthCheck()
      expect(health.healthy).toBe(true)
      expect(health.models).toContain('llama3:8b')

      vi.unstubAllGlobals()
    })

    it('should return unhealthy status when API fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Connection refused')))

      const health = await provider.healthCheck()
      expect(health.healthy).toBe(false)
      expect(health.message).toContain('Connection refused')

      vi.unstubAllGlobals()
    })
  })

  describe('complete', () => {
    it('should make correct API call', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            model: 'llama3:8b',
            message: { role: 'assistant', content: 'Hello!' },
            done: true,
            prompt_eval_count: 10,
            eval_count: 5,
          }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const response = await provider.complete([
        { role: 'user', content: 'Hi' },
      ])

      expect(response.content).toBe('Hello!')
      expect(response.model).toBe('llama3:8b')
      expect(response.usage.inputTokens).toBe(10)
      expect(response.usage.outputTokens).toBe(5)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/chat',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )

      vi.unstubAllGlobals()
    })

    it('should throw error on API failure', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }))

      await expect(
        provider.complete([{ role: 'user', content: 'Hi' }])
      ).rejects.toThrow('Ollama API error: 500')

      vi.unstubAllGlobals()
    })
  })
})
