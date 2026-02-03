// LLM Provider Types

// Provider type identifiers
export type ProviderType = 'ollama' | 'claude-cli' | 'openai' | 'anthropic'

// Message types
export type MessageRole = 'system' | 'user' | 'assistant'

export interface ContentBlock {
  type: 'text' | 'image'
  text?: string
  imageUrl?: string
}

export interface LLMMessage {
  role: MessageRole
  content: string | ContentBlock[]
}

// Completion options
export interface LLMCompletionOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  stop?: string[]
  stream?: boolean
  signal?: AbortSignal
}

// Token usage tracking
export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

// Finish reasons
export type FinishReason = 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'error'

// Response types
export interface LLMResponse {
  id: string
  provider: ProviderType
  model: string
  content: string
  contentBlocks?: ContentBlock[]
  usage: TokenUsage
  finishReason: FinishReason
  latencyMs: number
}

export interface LLMStreamChunk {
  id: string
  index: number
  content: string
  delta?: { text?: string }
  done: boolean
  finishReason?: FinishReason
}

// Legacy compatibility alias
export interface LLMCompletionResult {
  content: string
  model: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason?: FinishReason
}

// Provider capabilities
export interface ProviderCapabilities {
  streaming: boolean
  functionCalling: boolean
  vision: boolean
  maxTokens: number
  models: string[]
}

// Health check result
export interface HealthCheckResult {
  healthy: boolean
  latencyMs: number
  message?: string
  models?: string[]
}

// Provider interface
export interface LLMProvider {
  readonly id: string
  readonly type: ProviderType
  readonly name: string
  readonly capabilities: ProviderCapabilities
  readonly isInitialized: boolean

  initialize(): Promise<void>
  isAvailable(): Promise<boolean>
  complete(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): Promise<LLMResponse>
  stream(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): AsyncIterable<LLMStreamChunk>
  healthCheck(): Promise<HealthCheckResult>
  dispose(): Promise<void>
}

// Base provider config
export interface LLMProviderConfig {
  type?: ProviderType
  enabled?: boolean
  apiKey?: string
  baseUrl?: string
  model?: string
  timeout?: number
  maxRetries?: number
}

// Provider-specific configs
export interface OllamaConfig extends LLMProviderConfig {
  type: 'ollama'
  baseUrl: string
  defaultModel: string
}

export interface ClaudeCliConfig extends LLMProviderConfig {
  type: 'claude-cli'
  cliPath?: string
  defaultModel?: string
}

export interface OpenAIConfig extends LLMProviderConfig {
  type: 'openai'
  apiKey: string
  defaultModel?: string
}

export interface AnthropicConfig extends LLMProviderConfig {
  type: 'anthropic'
  apiKey: string
  defaultModel?: string
}

export type ProviderConfig = OllamaConfig | ClaudeCliConfig | OpenAIConfig | AnthropicConfig

// Error types
export type LLMErrorCode =
  | 'PROVIDER_NOT_AVAILABLE'
  | 'AUTHENTICATION_FAILED'
  | 'RATE_LIMITED'
  | 'INVALID_REQUEST'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN'

export class LLMError extends Error {
  constructor(
    public readonly code: LLMErrorCode,
    message: string,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = 'LLMError'
  }
}

// Entity Types for Knowledge Graph
export interface Entity {
  id: string
  type: EntityType
  name: string
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export type EntityType =
  | 'person'
  | 'place'
  | 'organization'
  | 'event'
  | 'concept'
  | 'date'
  | 'time'
  | 'task'
  | 'project'
  | 'tag'
  | 'custom'

export interface EntityRelation {
  id: string
  sourceId: string
  targetId: string
  type: RelationType
  weight?: number
  metadata?: Record<string, unknown>
  createdAt: Date
}

export type RelationType =
  | 'mentions'
  | 'related_to'
  | 'part_of'
  | 'depends_on'
  | 'created_by'
  | 'assigned_to'
  | 'scheduled_for'
  | 'tagged_with'
  | 'similar_to'
  | 'custom'

// Note Types
export interface Note {
  id: string
  content: string
  rawContent?: string
  entities: string[] // Entity IDs
  embedding?: number[]
  createdAt: Date
  updatedAt: Date
  metadata?: NoteMetadata
}

export interface NoteMetadata {
  source?: 'text' | 'voice' | 'import'
  tags?: string[]
  isArchived?: boolean
  isPinned?: boolean
}

// Search Types
export interface SearchQuery {
  text: string
  limit?: number
  offset?: number
  filters?: SearchFilters
}

export interface SearchFilters {
  entityTypes?: EntityType[]
  dateRange?: {
    start?: Date
    end?: Date
  }
  tags?: string[]
}

export interface SearchResult {
  note: Note
  score: number
  highlights?: string[]
}

// Reminder Types
export interface Reminder {
  id: string
  noteId: string
  type: 'time' | 'commitment' | 'follow_up'
  triggerAt: Date
  message: string
  isCompleted: boolean
  createdAt: Date
}
