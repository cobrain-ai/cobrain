import type { Note, Entity, EntityRelation, Reminder } from '@cobrain/core'

export interface DatabaseConfig {
  path: string
  enableWAL?: boolean
}

export interface NotesRepository {
  create(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note>
  findById(id: string): Promise<Note | null>
  findAll(options?: { limit?: number; offset?: number }): Promise<Note[]>
  update(id: string, data: Partial<Note>): Promise<Note>
  delete(id: string): Promise<void>
  search(query: string, limit?: number): Promise<Note[]>
}

export interface EntitiesRepository {
  create(entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>): Promise<Entity>
  findById(id: string): Promise<Entity | null>
  findByType(type: string): Promise<Entity[]>
  findByName(name: string): Promise<Entity[]>
  update(id: string, data: Partial<Entity>): Promise<Entity>
  delete(id: string): Promise<void>
  createRelation(
    relation: Omit<EntityRelation, 'id' | 'createdAt'>
  ): Promise<EntityRelation>
  findRelations(entityId: string): Promise<EntityRelation[]>
  deleteRelation(id: string): Promise<void>
}

export interface VectorsRepository {
  store(id: string, embedding: number[]): Promise<void>
  findSimilar(
    embedding: number[],
    limit?: number,
    threshold?: number
  ): Promise<Array<{ id: string; score: number }>>
  delete(id: string): Promise<void>
}

export interface RemindersRepository {
  create(reminder: Omit<Reminder, 'id' | 'createdAt'>): Promise<Reminder>
  findById(id: string): Promise<Reminder | null>
  findPending(before?: Date): Promise<Reminder[]>
  findByNote(noteId: string): Promise<Reminder[]>
  markComplete(id: string): Promise<void>
  delete(id: string): Promise<void>
}

export interface Database {
  notes: NotesRepository
  entities: EntitiesRepository
  vectors: VectorsRepository
  reminders: RemindersRepository
  close(): Promise<void>
}
