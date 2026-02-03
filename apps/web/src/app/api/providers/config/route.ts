import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { providerConfigStore } from '@/lib/provider-config-store'

const configSchema = z.object({
  activeProvider: z.string(),
  configs: z.record(
    z.object({
      type: z.enum(['ollama', 'claude-cli', 'openai', 'anthropic']),
      enabled: z.boolean(),
      model: z.string().optional(),
      apiKey: z.string().optional(),
      baseUrl: z.string().optional(),
      cliPath: z.string().optional(),
    })
  ),
})

export async function GET(): Promise<NextResponse> {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const config = providerConfigStore.get(session.user.id)
  return NextResponse.json(config)
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parseResult = await parseConfigBody(request)
  if ('error' in parseResult) {
    return NextResponse.json({ error: parseResult.error }, { status: 400 })
  }

  providerConfigStore.set(session.user.id, parseResult)

  // TODO: Persist to database
  // await settingsRepository.upsert({
  //   userId: session.user.id,
  //   providerConfig: parseResult,
  // })

  return NextResponse.json({ success: true })
}

async function parseConfigBody(
  request: Request
): Promise<z.infer<typeof configSchema> | { error: string }> {
  try {
    const body = await request.json()
    const result = configSchema.safeParse(body)

    if (!result.success) {
      return { error: result.error.errors[0].message }
    }

    return result.data
  } catch {
    return { error: 'Invalid JSON body' }
  }
}
