import { BaseProvider } from './base.js'
import type {
  LLMMessage,
  LLMCompletionOptions,
  LLMResponse,
  LLMStreamChunk,
  ProviderType,
  ProviderCapabilities,
  HealthCheckResult,
  ClaudeCliConfig,
} from '../types/index.js'
import { generateId } from '../utils/id.js'

interface ClaudeCliJsonResponse {
  type?: string
  result: string
  model?: string
  usage?: {
    input_tokens: number
    output_tokens: number
  }
  modelUsage?: Record<string, {
    inputTokens: number
    outputTokens: number
  }>
}

interface TokenCount {
  inputTokens: number
  outputTokens: number
}

function extractTokenUsage(data: ClaudeCliJsonResponse): TokenCount {
  if (data.usage) {
    return {
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
    }
  }

  if (data.modelUsage) {
    const first = Object.values(data.modelUsage)[0]
    if (first) {
      return {
        inputTokens: first.inputTokens,
        outputTokens: first.outputTokens,
      }
    }
  }

  return { inputTokens: 0, outputTokens: 0 }
}

export class ClaudeCliProvider extends BaseProvider {
  readonly type: ProviderType = 'claude-cli'
  readonly name = 'Claude CLI'
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    functionCalling: true,
    vision: true,
    maxTokens: 200000,
    models: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514'],
  }

  private cliPath: string

  constructor(config: Partial<ClaudeCliConfig> = {}) {
    super({
      type: 'claude-cli',
      ...config,
    })
    this.cliPath = config.cliPath ?? 'claude'
  }

  async initialize(): Promise<void> {
    await super.initialize()
    // Verify CLI is available
    const available = await this.isAvailable()
    if (!available) {
      throw new Error('Claude CLI not found. Please install it first.')
    }
  }

  protected getDefaultModel(): string {
    return 'claude-sonnet-4-20250514'
  }

  async isAvailable(): Promise<boolean> {
    try {
      const { execSync } = await import('child_process')
      execSync(`${this.cliPath} --version`, { stdio: 'pipe' })
      return true
    } catch {
      return false
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now()
    try {
      const { execSync } = await import('child_process')
      const output = execSync(`${this.cliPath} --version`, { stdio: 'pipe' })
      return {
        healthy: true,
        latencyMs: Date.now() - start,
        message: output.toString().trim(),
        models: this.capabilities.models,
      }
    } catch (error) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        message: error instanceof Error ? error.message : 'Claude CLI not available',
      }
    }
  }

  async complete(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): Promise<LLMResponse> {
    const start = Date.now()
    const model = options?.model ?? this.getModel()

    // Build prompt from messages
    const prompt = this.buildPrompt(messages)

    try {
      const { spawn } = await import('child_process')

      return new Promise((resolve, reject) => {
        const args = [
          '--print',
          '--output-format', 'json',
          '-p', prompt,
        ]

        const proc = spawn(this.cliPath, args, {
          stdio: ['pipe', 'pipe', 'pipe'],
        })

        let stdout = ''
        let stderr = ''

        proc.stdout.on('data', (data: Buffer) => {
          stdout += data.toString()
        })

        proc.stderr.on('data', (data: Buffer) => {
          stderr += data.toString()
        })

        proc.on('close', (code) => {
          const latencyMs = Date.now() - start

          if (code !== 0) {
            reject(new Error(`Claude CLI exited with code ${code}: ${stderr}`))
            return
          }

          try {
            const data = JSON.parse(stdout) as ClaudeCliJsonResponse
            const content = data.result ?? ''
            const { inputTokens, outputTokens } = extractTokenUsage(data)
            const hasUsage = inputTokens > 0 || outputTokens > 0

            resolve(this.createResponse({
              content,
              model,
              usage: hasUsage ? {
                inputTokens,
                outputTokens,
                totalTokens: inputTokens + outputTokens,
              } : undefined,
              finishReason: 'stop',
              latencyMs,
            }))
          } catch {
            // If JSON parsing fails, treat stdout as plain text
            resolve(this.createResponse({
              content: stdout.trim(),
              model,
              finishReason: 'stop',
              latencyMs,
            }))
          }
        })

        proc.on('error', (error) => {
          reject(error)
        })

        // Handle abort signal
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            proc.kill()
            reject(new Error('Request aborted'))
          })
        }
      })
    } catch (error) {
      throw new Error(`Claude CLI error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async *stream(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): AsyncIterable<LLMStreamChunk> {
    void (options?.model ?? this.getModel()) // Reserved for future stream model selection
    const responseId = generateId()
    const prompt = this.buildPrompt(messages)

    const { spawn } = await import('child_process')

    const args = [
      '--print',
      '--output-format', 'stream-json',
      '-p', prompt,
    ]

    const proc = spawn(this.cliPath, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let index = 0
    let buffer = ''

    // Handle abort signal
    if (options?.signal) {
      options.signal.addEventListener('abort', () => {
        proc.kill()
      })
    }

    const decoder = new TextDecoder()

    for await (const chunk of proc.stdout) {
      buffer += decoder.decode(chunk as Buffer, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const data = JSON.parse(line)
          if (data.type === 'content' && data.content) {
            yield {
              id: responseId,
              index: index++,
              content: data.content,
              delta: { text: data.content },
              done: false,
            }
          } else if (data.type === 'done') {
            yield {
              id: responseId,
              index: index++,
              content: '',
              done: true,
              finishReason: 'stop',
            }
          }
        } catch {
          // Non-JSON line, treat as content
          yield {
            id: responseId,
            index: index++,
            content: line,
            delta: { text: line },
            done: false,
          }
        }
      }
    }
  }

  private buildPrompt(messages: LLMMessage[]): string {
    return messages
      .map((m) => {
        const content = typeof m.content === 'string'
          ? m.content
          : m.content.map((b) => b.text).join('')

        switch (m.role) {
          case 'system': return `System: ${content}`
          case 'user': return `Human: ${content}`
          case 'assistant': return `Assistant: ${content}`
        }
      })
      .join('\n\n')
  }
}
