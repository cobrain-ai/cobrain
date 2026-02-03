import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createProvider, requiresApiKey } from '@/lib/providers'
import type { ProviderTestResult, ProviderType } from '@/lib/providers'

const testSchema = z.object({
  type: z.enum(['ollama', 'claude-cli', 'openai', 'anthropic']),
  config: z
    .object({
      model: z.string().optional(),
      apiKey: z.string().optional(),
      baseUrl: z.string().optional(),
      cliPath: z.string().optional(),
    })
    .optional(),
})

export async function POST(request: Request): Promise<NextResponse> {
  const parseResult = await parseRequest(request)
  if ('error' in parseResult) {
    return NextResponse.json({ error: parseResult.error }, { status: 400 })
  }

  const { type, config } = parseResult

  // Validate API key requirement
  if (requiresApiKey(type) && !config?.apiKey) {
    return NextResponse.json(
      { error: `API key required for ${type}` },
      { status: 400 }
    )
  }

  return testProviderConnection(type, config)
}

async function parseRequest(
  request: Request
): Promise<{ type: ProviderType; config?: z.infer<typeof testSchema>['config'] } | { error: string }> {
  try {
    const body = await request.json()
    const result = testSchema.safeParse(body)

    if (!result.success) {
      return { error: result.error.errors[0].message }
    }

    return result.data
  } catch {
    return { error: 'Invalid JSON body' }
  }
}

async function testProviderConnection(
  type: ProviderType,
  config?: z.infer<typeof testSchema>['config']
): Promise<NextResponse> {
  const start = Date.now()
  const provider = createProvider({ type, config })

  if (!provider) {
    return NextResponse.json({
      status: 'error',
      available: false,
      latency: Date.now() - start,
      error: 'Failed to create provider',
    } satisfies ProviderTestResult)
  }

  try {
    await provider.initialize()
    const available = await provider.isAvailable()

    if (!available) {
      await provider.dispose()
      return NextResponse.json({
        status: 'disconnected',
        available: false,
        latency: Date.now() - start,
        error: 'Provider not available',
      } satisfies ProviderTestResult)
    }

    // Perform a quick test completion
    const testResponse = await provider.complete(
      [{ role: 'user', content: 'Say "OK" if you can hear me.' }],
      { maxTokens: 10 }
    )

    await provider.dispose()

    return NextResponse.json({
      status: 'connected',
      available: true,
      latency: Date.now() - start,
      model: provider.getModel(),
      testResponse: testResponse.content.substring(0, 100),
    } satisfies ProviderTestResult)
  } catch (error) {
    try {
      await provider.dispose()
    } catch {
      // Ignore disposal errors
    }

    return NextResponse.json({
      status: 'error',
      available: false,
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    } satisfies ProviderTestResult)
  }
}
