import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { writingStyleGuidesRepository } from '@cobrain/database'

const createStyleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  isDefault: z.boolean().optional(),
  tone: z.string().optional(),
  language: z.string().optional(),
  targetAudience: z.string().optional(),
  customToneDescription: z.string().optional(),
  samplePost: z.string().optional(),
  rules: z.array(z.object({ type: z.string(), description: z.string() })).optional(),
  serviceOverrides: z.record(z.unknown()).optional(),
})

export async function GET(): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const styles = await writingStyleGuidesRepository.findByUser(session.user.id)
  return NextResponse.json({ styles })
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const result = createStyleSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  const style = await writingStyleGuidesRepository.create({
    userId: session.user.id,
    ...result.data,
  })

  return NextResponse.json({ style }, { status: 201 })
}
