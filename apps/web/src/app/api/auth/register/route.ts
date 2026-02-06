import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = registerSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, email, password } = result.data

    // TODO: Check if user already exists
    // const existingUser = await usersRepository.findByEmail(email)
    // if (existingUser) {
    //   return NextResponse.json(
    //     { error: 'An account with this email already exists' },
    //     { status: 409 }
    //   )
    // }

    // Hash password with bcrypt (10+ rounds as per security requirements)
    // TODO: Create user in database when repository is available
    // const hashedPassword = await hash(password, 12)
    // const user = await usersRepository.create({ name, email, password: hashedPassword })
    await hash(password, 12)

    // For now, return success (mock implementation)
    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: { name, email },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
