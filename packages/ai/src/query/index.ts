export {
  processQuery,
  answerQuery,
  classifyIntent,
} from './query-engine.js'

export type {
  QueryRequest,
  QueryResponse,
  QueryContext,
  QueryIntent,
} from './query-engine.js'

// Re-export semantic search from parent
export { semanticSearch } from '../query.js'
