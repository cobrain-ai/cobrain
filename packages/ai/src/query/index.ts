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

// Note: semanticSearch is exported from ../search/index.js instead
