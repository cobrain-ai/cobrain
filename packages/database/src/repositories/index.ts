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
export type { CreateReminderInput, UpdateReminderInput } from './reminders.js'

export { embeddingsRepository } from './embeddings.js'
export type { StoreEmbeddingInput, SimilarResult } from './embeddings.js'
