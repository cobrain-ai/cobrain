import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock NextAuth
vi.mock('next-auth', () => ({
  default: vi.fn((config) => ({
    handlers: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
    auth: vi.fn(async () => null),
  })),
}))

vi.mock('next-auth/providers/credentials', () => ({
  default: vi.fn(),
}))

vi.mock('next-auth/providers/github', () => ({
  default: vi.fn(),
}))

vi.mock('next-auth/providers/google', () => ({
  default: vi.fn(),
}))

describe('Auth', () => {
  let originalNodeEnv: string | undefined

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV
    vi.resetModules()
  })

  afterEach(() => {
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv
    } else {
      delete process.env.NODE_ENV
    }
  })

  describe('Development Mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('should return mock session when called as session getter in development', async () => {
      const { auth } = await import('./auth.js')
      const session = await auth()

      expect(session).toBeDefined()
      expect(session.user).toBeDefined()
      expect(session.user.id).toBe('1')
      expect(session.user.email).toBe('demo@cobrain.ai')
      expect(session.user.name).toBe('Demo User')
      expect(session.expires).toBeDefined()
    })

    it('should have valid expiration date in future', async () => {
      const { auth } = await import('./auth.js')
      const session = await auth()

      const expiresDate = new Date(session.expires)
      const now = new Date()
      expect(expiresDate.getTime()).toBeGreaterThan(now.getTime())
    })

    it('should export handlers, signIn, signOut', async () => {
      const { handlers, signIn, signOut } = await import('./auth.js')

      expect(handlers).toBeDefined()
      expect(signIn).toBeDefined()
      expect(signOut).toBeDefined()
    })
  })

  describe('Production Mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production'
    })

    it('should use NextAuth auth function in production', async () => {
      const { auth } = await import('./auth.js')

      // In production, it should use the actual NextAuth auth
      // which we've mocked to return null
      const session = await auth()

      // The mock returns null, but in real production it would
      // check the actual session
      expect(session).toBeNull()
    })
  })

  describe('Middleware Wrapper', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('should work as middleware wrapper with function argument', async () => {
      const { auth } = await import('./auth.js')

      // auth() can be called with a function for middleware
      const middlewareFn = vi.fn((req) => req)

      // This tests that auth can be called as: auth((req) => ...)
      // In dev mode, it delegates to NextAuth's auth for middleware
      const result = (auth as any)(middlewareFn)

      expect(result).toBeDefined()
    })
  })

  describe('Mock Session Structure', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('should match Session type structure', async () => {
      const { auth } = await import('./auth.js')
      const session = await auth()

      // Verify structure matches NextAuth Session type
      expect(session).toHaveProperty('user')
      expect(session).toHaveProperty('expires')
      expect(session.user).toHaveProperty('id')
      expect(session.user).toHaveProperty('email')
      expect(session.user).toHaveProperty('name')
      expect(session.user).toHaveProperty('image')
    })

    it('should have image as null', async () => {
      const { auth } = await import('./auth.js')
      const session = await auth()

      expect(session.user.image).toBeNull()
    })

    it('should have session expiry ~7 days in future', async () => {
      const { auth } = await import('./auth.js')
      const session = await auth()

      const expiresDate = new Date(session.expires)
      const now = new Date()
      const diffDays = (expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

      // Should expire in approximately 7 days (allow 6-8 days range)
      expect(diffDays).toBeGreaterThan(6)
      expect(diffDays).toBeLessThan(8)
    })
  })
})
