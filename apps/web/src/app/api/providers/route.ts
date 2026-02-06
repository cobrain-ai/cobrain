import { NextResponse } from 'next/server'
import { PROVIDERS, createProvider, requiresApiKey } from '@/lib/providers'
import type { ProviderStatus, ProviderInfo } from '@/lib/providers'

export async function GET(): Promise<NextResponse> {
  const results = await Promise.all(PROVIDERS.map(checkProviderStatus))
  return NextResponse.json({ providers: results })
}

async function checkProviderStatus(providerInfo: ProviderInfo): Promise<ProviderStatus> {
  const baseStatus: ProviderStatus = {
    ...providerInfo,
    status: 'disconnected',
    available: false,
  }

  // Check for missing API key early
  if (requiresApiKey(providerInfo.type)) {
    const envKey = providerInfo.type === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'
    if (!process.env[envKey]) {
      return { ...baseStatus, error: 'API key not configured' }
    }
  }

  const provider = createProvider({ type: providerInfo.type })
  if (!provider) {
    return { ...baseStatus, error: 'Failed to create provider' }
  }

  const start = Date.now()

  try {
    await provider.initialize()
    const available = await provider.isAvailable()
    const latency = Date.now() - start

    if (available) {
      await provider.dispose()
      return {
        ...providerInfo,
        status: 'connected',
        available: true,
        latency,
      }
    }

    await provider.dispose()
    return { ...baseStatus, error: 'Provider not available' }
  } catch (err) {
    try {
      await provider.dispose()
    } catch {
      // Ignore disposal errors
    }
    return {
      ...baseStatus,
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
