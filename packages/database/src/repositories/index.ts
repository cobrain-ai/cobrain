// Database Repositories
export { notesRepository } from './notes.js'
export type { CreateNoteInput, UpdateNoteInput, NotesQueryOptions } from './notes.js'

export { usersRepository } from './users.js'
export type { CreateUserInput, UpdateUserInput, User } from './users.js'

export { entitiesRepository } from './entities.js'
export type {
  CreateEntityInput,
  LinkEntityToNoteInput,
  CreateRelationInput,
} from './entities.js'

export { remindersRepository } from './reminders.js'
export type { CreateReminderInput, UpdateReminderInput, ReminderStatus, ReminderType } from './reminders.js'

export { embeddingsRepository } from './embeddings.js'
export type { StoreEmbeddingInput, SimilarResult } from './embeddings.js'

export { graphRepository } from './graph.js'
export type {
  GraphNode,
  GraphPath,
  GraphNeighborhood,
  GraphStats,
  TraversalOptions,
} from './graph.js'

export { viewsRepository } from './views.js'
export type {
  View,
  ViewSnapshot,
  ViewQuery,
  ViewSettings,
  ViewLayout,
  ViewType,
  CreateViewInput,
  UpdateViewInput,
  ShareAccessLog,
  ShareAnalytics,
} from './views.js'
