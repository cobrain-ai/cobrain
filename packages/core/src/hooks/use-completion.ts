'use client'

import { useState, useCallback, useRef } from 'react'
import type {
  LLMMessage,
  LLMCompletionOptions,
  LLMResponse,
  LLMStreamChunk,
} from '../types/index.js'
import { getGlobalRegistry } from '../providers/registry.js'

export interface UseCompletionOptions {
  providerId?: string
  defaultOptions?: LLMCompletionOptions
  onChunk?: (chunk: LLMStreamChunk) => void
  onComplete?: (response: LLMResponse) => void
  onError?: (error: Error) => void
}

export interface UseCompletionResult {
  complete: (messages: LLMMessage[], options?: LLMCompletionOptions) => Promise<LLMResponse>
  stream: (messages: LLMMessage[], options?: LLMCompletionOptions) => Promise<LLMResponse>
  cancel: () => void
  isLoading: boolean
  isStreaming: boolean
  streamedContent: string
  response: LLMResponse | null
  error: Error | null
}

export function useCompletion(options: UseCompletionOptions = {}): UseCompletionResult {
  const {
    providerId,
    defaultOptions = {},
    onChunk,
    onComplete,
    onError,
  } = options

  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamedContent, setStreamedContent] = useState('')
  const [response, setResponse] = useState<LLMResponse | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const complete = useCallback(
    async (messages: LLMMessage[], opts?: LLMCompletionOptions): Promise<LLMResponse> => {
      const registry = getGlobalRegistry()
      const provider = registry.get(providerId)

      setIsLoading(true)
      setError(null)
      setResponse(null)

      abortControllerRef.current = new AbortController()

      try {
        const result = await provider.complete(messages, {
          ...defaultOptions,
          ...opts,
          signal: abortControllerRef.current.signal,
        })

        setResponse(result)
        onComplete?.(result)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Completion failed')
        setError(error)
        onError?.(error)
        throw error
      } finally {
        setIsLoading(false)
        abortControllerRef.current = null
      }
    },
    [providerId, defaultOptions, onComplete, onError]
  )

  const stream = useCallback(
    async (messages: LLMMessage[], opts?: LLMCompletionOptions): Promise<LLMResponse> => {
      const registry = getGlobalRegistry()
      const provider = registry.get(providerId)

      setIsLoading(true)
      setIsStreaming(true)
      setError(null)
      setResponse(null)
      setStreamedContent('')

      abortControllerRef.current = new AbortController()

      try {
        let content = ''
        let lastChunk: LLMStreamChunk | null = null

        for await (const chunk of provider.stream(messages, {
          ...defaultOptions,
          ...opts,
          signal: abortControllerRef.current.signal,
        })) {
          content += chunk.content
          lastChunk = chunk
          setStreamedContent(content)
          onChunk?.(chunk)

          if (chunk.done) {
            break
          }
        }

        // Build final response
        const result: LLMResponse = {
          id: lastChunk?.id ?? '',
          provider: provider.type,
          model: opts?.model ?? provider.capabilities.models[0] ?? '',
          content,
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          finishReason: lastChunk?.finishReason ?? 'stop',
          latencyMs: 0,
        }

        setResponse(result)
        onComplete?.(result)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Streaming failed')
        setError(error)
        onError?.(error)
        throw error
      } finally {
        setIsLoading(false)
        setIsStreaming(false)
        abortControllerRef.current = null
      }
    },
    [providerId, defaultOptions, onChunk, onComplete, onError]
  )

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  return {
    complete,
    stream,
    cancel,
    isLoading,
    isStreaming,
    streamedContent,
    response,
    error,
  }
}
