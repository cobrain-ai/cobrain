import { useState, useEffect, useCallback } from 'react'
import type { LLMProvider, HealthCheckResult } from '../types/index.js'
import { getGlobalRegistry } from '../providers/registry.js'

export interface UseProviderOptions {
  providerId?: string
  autoHealthCheck?: boolean
  healthCheckIntervalMs?: number
}

export interface UseProviderResult {
  provider: LLMProvider | null
  isLoading: boolean
  error: Error | null
  health: HealthCheckResult | null
  switchProvider: (providerId: string) => void
  refreshHealth: () => Promise<void>
}

export function useProvider(options: UseProviderOptions = {}): UseProviderResult {
  const {
    providerId: initialProviderId,
    autoHealthCheck = false,
    healthCheckIntervalMs = 30000,
  } = options

  const [providerId, setProviderId] = useState<string | undefined>(initialProviderId)
  const [provider, setProvider] = useState<LLMProvider | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [health, setHealth] = useState<HealthCheckResult | null>(null)

  // Get provider from registry
  useEffect(() => {
    const registry = getGlobalRegistry()
    setIsLoading(true)
    setError(null)

    try {
      const id = providerId ?? registry.getDefaultId()
      if (id) {
        const p = registry.get(id)
        setProvider(p)
      } else {
        setProvider(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get provider'))
      setProvider(null)
    } finally {
      setIsLoading(false)
    }
  }, [providerId])

  // Health check
  const refreshHealth = useCallback(async () => {
    if (!provider) {
      setHealth(null)
      return
    }

    try {
      const result = await provider.healthCheck()
      setHealth(result)
    } catch (err) {
      setHealth({
        healthy: false,
        latencyMs: 0,
        message: err instanceof Error ? err.message : 'Health check failed',
      })
    }
  }, [provider])

  // Auto health check interval
  useEffect(() => {
    if (!autoHealthCheck || !provider) return

    refreshHealth()

    const interval = setInterval(refreshHealth, healthCheckIntervalMs)
    return () => clearInterval(interval)
  }, [autoHealthCheck, healthCheckIntervalMs, provider, refreshHealth])

  // Switch provider
  const switchProvider = useCallback((newProviderId: string) => {
    setProviderId(newProviderId)
  }, [])

  return {
    provider,
    isLoading,
    error,
    health,
    switchProvider,
    refreshHealth,
  }
}
