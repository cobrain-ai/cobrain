import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ClaudeCliProvider } from './claude-cli.js'
import type { LLMMessage } from '../types/index.js'

// Mock child_process
vi.mock('child_process', () => ({
  spawn: vi.fn(),
  execSync: vi.fn(),
}))

describe('ClaudeCliProvider', () => {
  let provider: ClaudeCliProvider
  let mockSpawn: ReturnType<typeof vi.fn>
  let mockExecSync: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    // Get mocks
    const childProcess = await import('child_process')
    mockSpawn = vi.mocked(childProcess.spawn)
    mockExecSync = vi.mocked(childProcess.execSync)

    // Default: CLI is available
    mockExecSync.mockReturnValue(Buffer.from('2.1.38 (Claude Code)'))

    provider = new ClaudeCliProvider()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should create with default configuration', () => {
      expect(provider.name).toBe('Claude CLI')
      expect(provider.type).toBe('claude-cli')
    })

    it('should accept custom CLI path', () => {
      const custom = new ClaudeCliProvider({ cliPath: '/custom/path/claude' })
      expect(custom).toBeDefined()
    })
  })

  describe('isAvailable', () => {
    it('should return true when claude CLI is installed', async () => {
      mockExecSync.mockReturnValue(Buffer.from('2.1.38'))
      const available = await provider.isAvailable()
      expect(available).toBe(true)
      expect(mockExecSync).toHaveBeenCalledWith('claude --version', { stdio: 'pipe' })
    })

    it('should return false when claude CLI is not installed', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('command not found')
      })
      const available = await provider.isAvailable()
      expect(available).toBe(false)
    })
  })

  describe('healthCheck', () => {
    it('should return healthy when CLI is available', async () => {
      mockExecSync.mockReturnValue(Buffer.from('2.1.38 (Claude Code)'))
      const health = await provider.healthCheck()

      expect(health.healthy).toBe(true)
      expect(health.message).toContain('2.1.38')
      expect(health.models).toContain('claude-sonnet-4-20250514')
    })

    it('should return unhealthy when CLI is not available', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('CLI not found')
      })
      const health = await provider.healthCheck()

      expect(health.healthy).toBe(false)
      expect(health.message).toContain('CLI not found')
    })
  })

  describe('complete', () => {
    it('should parse JSON response with type and result fields', async () => {
      const messages: LLMMessage[] = [
        { role: 'user', content: 'Say OK if you can hear me.' },
      ]

      const mockResponse = {
        type: 'result',
        subtype: 'success',
        result: 'OK',
        modelUsage: {
          'claude-opus-4-6': {
            inputTokens: 3,
            outputTokens: 4,
          },
        },
      }

      mockSpawn.mockReturnValue(createMockProcess(JSON.stringify(mockResponse)))

      const response = await provider.complete(messages)

      expect(response.content).toBe('OK')
      expect(response.usage.inputTokens).toBe(3)
      expect(response.usage.outputTokens).toBe(4)
      expect(response.finishReason).toBe('stop')
    })

    it('should NOT pass --max-tokens flag', async () => {
      const messages: LLMMessage[] = [{ role: 'user', content: 'Test' }]

      mockSpawn.mockReturnValue(
        createMockProcess(JSON.stringify({ type: 'result', result: 'Test response' }))
      )

      await provider.complete(messages, { maxTokens: 100 })

      const spawnArgs = mockSpawn.mock.calls[0][1] as string[]
      expect(spawnArgs).not.toContain('--max-tokens')
      expect(spawnArgs).not.toContain('100')
    })

    it('should pass correct arguments to CLI', async () => {
      const messages: LLMMessage[] = [{ role: 'user', content: 'Hello' }]

      mockSpawn.mockReturnValue(
        createMockProcess(JSON.stringify({ type: 'result', result: 'Hi' }))
      )

      await provider.complete(messages)

      expect(mockSpawn).toHaveBeenCalledWith(
        'claude',
        expect.arrayContaining([
          '--print',
          '--output-format',
          'json',
          '-p',
          'Human: Hello',
        ]),
        { stdio: ['pipe', 'pipe', 'pipe'] }
      )
    })

    it('should handle CLI exit with error code', async () => {
      const messages: LLMMessage[] = [{ role: 'user', content: 'Test' }]

      mockSpawn.mockReturnValue(createMockProcess('', 'CLI error', 1))

      // The mock also triggers error event which throws 'Process error'
      await expect(provider.complete(messages)).rejects.toThrow()
    })

    it('should handle non-JSON output as plain text', async () => {
      const messages: LLMMessage[] = [{ role: 'user', content: 'Test' }]

      mockSpawn.mockReturnValue(createMockProcess('Plain text response'))

      const response = await provider.complete(messages)
      expect(response.content).toBe('Plain text response')
    })

    it('should handle abort signal', async () => {
      const messages: LLMMessage[] = [{ role: 'user', content: 'Test' }]
      const abortController = new AbortController()

      const mockProcess = createMockProcess('', '', 0, true)
      mockSpawn.mockReturnValue(mockProcess)

      const promise = provider.complete(messages, { signal: abortController.signal })

      // Abort after a short delay
      setTimeout(() => abortController.abort(), 10)

      await expect(promise).rejects.toThrow('Request aborted')
      expect(mockProcess.kill).toHaveBeenCalled()
    })

    it('should extract usage from modelUsage object', async () => {
      const messages: LLMMessage[] = [{ role: 'user', content: 'Test' }]

      const mockResponse = {
        type: 'result',
        result: 'Response',
        modelUsage: {
          'claude-sonnet-4-5': {
            inputTokens: 10,
            outputTokens: 20,
          },
        },
      }

      mockSpawn.mockReturnValue(createMockProcess(JSON.stringify(mockResponse)))

      const response = await provider.complete(messages)

      expect(response.usage.inputTokens).toBe(10)
      expect(response.usage.outputTokens).toBe(20)
      expect(response.usage.totalTokens).toBe(30)
    })

    it('should handle missing usage data gracefully', async () => {
      const messages: LLMMessage[] = [{ role: 'user', content: 'Test' }]

      mockSpawn.mockReturnValue(
        createMockProcess(JSON.stringify({ type: 'result', result: 'Response' }))
      )

      const response = await provider.complete(messages)

      // When no usage data in the CLI response, createResponse defaults to 0s
      expect(response.usage).toEqual({
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      })
    })
  })

  describe('buildPrompt', () => {
    it('should format messages correctly', async () => {
      const messages: LLMMessage[] = [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ]

      mockSpawn.mockReturnValue(
        createMockProcess(JSON.stringify({ type: 'result', result: 'OK' }))
      )

      await provider.complete(messages)

      const spawnArgs = mockSpawn.mock.calls[0][1] as string[]
      const promptIndex = spawnArgs.indexOf('-p') + 1
      const prompt = spawnArgs[promptIndex]

      expect(prompt).toContain('System: You are helpful')
      expect(prompt).toContain('Human: Hello')
      expect(prompt).toContain('Assistant: Hi there!')
    })
  })
})

/**
 * Create a mock child process for testing
 */
function createMockProcess(
  stdout: string,
  stderr: string = '',
  exitCode: number = 0,
  allowAbort: boolean = false
) {
  const mockProcess: any = {
    stdout: {
      on: vi.fn((event, callback) => {
        if (event === 'data' && stdout) {
          setTimeout(() => callback(Buffer.from(stdout)), 10)
        }
      }),
    },
    stderr: {
      on: vi.fn((event, callback) => {
        if (event === 'data' && stderr) {
          setTimeout(() => callback(Buffer.from(stderr)), 10)
        }
      }),
    },
    on: vi.fn((event, callback) => {
      if (event === 'close') {
        setTimeout(() => callback(exitCode), allowAbort ? 50 : 20)
      } else if (event === 'error' && exitCode !== 0) {
        setTimeout(() => callback(new Error('Process error')), 10)
      }
    }),
    kill: vi.fn(),
  }

  return mockProcess
}
