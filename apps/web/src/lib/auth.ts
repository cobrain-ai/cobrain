import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import { compare } from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
})

// Dummy hash for timing-safe comparison when user not found
const DUMMY_HASH = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) {
          return null
        }

        const { email, password } = parsed.data

        // TODO: Replace with actual database query
        // const user = await usersRepository.findByEmail(email)
        // For now, use mock user for development
        const mockUser = {
          id: '1',
          email: 'demo@cobrain.ai',
          password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // "password"
          name: 'Demo User',
        }

        const user = email === mockUser.email ? mockUser : null
        const hashToCompare = user?.password ?? DUMMY_HASH

        // Always run compare to prevent timing attacks
        const isValidPassword = await compare(password, hashToCompare)
        if (!user || !isValidPassword) {
          return null
        }

        return {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        }
      },
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: '/login',
    newUser: '/signup',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
    }
  }
}
