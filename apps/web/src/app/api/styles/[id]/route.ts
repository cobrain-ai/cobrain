import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { writingStyleGuidesRepository } from '@cobrain/database'

const updateStyleSchema = z.object({
  name: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
  tone: z.string().optional(),
  language: z.string().optional(),
  targetAudience: z.string().optional(),
  customToneDescription: z.string().optional(),
  samplePost: z.string().optional(),
  rules: z.array(z.object({ type: z.string(), description: z.string() })).optional(),
  serviceOverrides: z.record(z.unknown()).optional(),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const style = await writingStyleGuidesRepository.findById(id)
  if (!style || style.userId !== session.user.id) {
    return NextResponse.json({ error: 'Style guide not found' }, { status: 404 })
  }

  return NextResponse.json({ style })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await writingStyleGuidesRepository.findById(id)
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Style guide not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const result = updateStyleSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  const updated = await writingStyleGuidesRepository.update(id, session.user.id, result.data)
  return NextResponse.json({ style: updated })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await writingStyleGuidesRepository.findById(id)
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Style guide not found' }, { status: 404 })
  }

  await writingStyleGuidesRepository.delete(id)
  return NextResponse.json({ success: true })
}
