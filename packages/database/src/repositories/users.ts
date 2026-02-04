import { eq } from 'drizzle-orm'

import { getDatabase, generateId, users } from '../client.js'

export interface CreateUserInput {
  email: string
  password: string
  name?: string
}

export interface UpdateUserInput {
  name?: string
  avatarUrl?: string
  settings?: Record<string, unknown>
}

export interface User {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  settings: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

function toUser(dbUser: typeof users.$inferSelect): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    avatarUrl: dbUser.avatarUrl,
    settings: (typeof dbUser.settings === 'string'
      ? JSON.parse(dbUser.settings)
      : dbUser.settings) as Record<string, unknown> ?? {},
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt,
  }
}

export const usersRepository = {
  async create(input: CreateUserInput): Promise<User> {
    const db = getDatabase()
    const id = generateId()
    const now = new Date()

    await db.insert(users).values({
      id,
      email: input.email,
      password: input.password,
      name: input.name,
      createdAt: now,
      updatedAt: now,
    })

    const user = await db.select().from(users).where(eq(users.id, id)).get()
    return toUser(user!)
  },

  async findById(id: string): Promise<User | null> {
    const db = getDatabase()
    const user = await db.select().from(users).where(eq(users.id, id)).get()
    return user ? toUser(user) : null
  },

  async findByEmail(email: string): Promise<(User & { password: string }) | null> {
    const db = getDatabase()
    const user = await db.select().from(users).where(eq(users.email, email)).get()
    return user
      ? {
          ...toUser(user),
          password: user.password,
        }
      : null
  },

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const db = getDatabase()
    const updates: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (input.name !== undefined) updates.name = input.name
    if (input.avatarUrl !== undefined) updates.avatarUrl = input.avatarUrl
    if (input.settings !== undefined) updates.settings = JSON.stringify(input.settings)

    await db.update(users).set(updates).where(eq(users.id, id))

    const user = await db.select().from(users).where(eq(users.id, id)).get()
    return toUser(user!)
  },

  async delete(id: string): Promise<void> {
    const db = getDatabase()
    await db.delete(users).where(eq(users.id, id))
  },

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    const db = getDatabase()
    await db.update(users).set({
      password: hashedPassword,
      updatedAt: new Date(),
    }).where(eq(users.id, id))
  },
}
