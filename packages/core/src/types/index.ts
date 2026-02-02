// LLM Provider Types

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMCompletionOptions {
  temperature?: number
  maxTokens?: number
  topP?: number
  stop?: string[]
  stream?: boolean
}

export interface LLMCompletionResult {
  content: string
  model: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason?: 'stop' | 'length' | 'content_filter' | 'tool_calls'
}

export interface LLMStreamChunk {
  content: string
  done: boolean
}

export interface LLMProvider {
  name: string
  isAvailable(): Promise<boolean>
  complete(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): Promise<LLMCompletionResult>
  stream?(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): AsyncIterable<LLMStreamChunk>
}

export interface LLMProviderConfig {
  apiKey?: string
  baseUrl?: string
  model?: string
  timeout?: number
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
