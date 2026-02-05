// @cobrain/ai - AI processing library

// Use modular exports to avoid duplicate symbol errors
export * from './extraction/index.js'
export * from './embeddings.js'
export * from './query/index.js'
export * from './search/index.js'
export * from './pipeline/index.js'

// Re-export legacy types that may still be needed
export type {
  ExtractionResult,
  ExtractedCommitment,
} from './extraction.js'
export { parseNaturalDate } from './extraction.js'

export type {
  QueryResult,
  SemanticSearchOptions,
} from './query.js'
