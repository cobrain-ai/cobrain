import { prisma } from '../client.js'

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

function toUser(dbUser: {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  settings: unknown
  createdAt: Date
  updatedAt: Date
}): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    avatarUrl: dbUser.avatarUrl,
    settings: (dbUser.settings as Record<string, unknown>) ?? {},
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt,
  }
}

export const usersRepository = {
  async create(input: CreateUserInput): Promise<User> {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: input.password,
        name: input.name,
      },
    })
    return toUser(user)
  },

  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    })
    return user ? toUser(user) : null
  },

  async findByEmail(email: string): Promise<(User & { password: string }) | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    })
    return user
      ? {
          ...toUser(user),
          password: user.password,
        }
      : null
  },

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
        ...(input.settings !== undefined && { settings: input.settings }),
      },
    })
    return toUser(user)
  },

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    })
  },

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    })
  },
}
