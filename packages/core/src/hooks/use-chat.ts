'use client'

import { useState, useCallback, useRef } from 'react'
import type {
  LLMMessage,
  LLMCompletionOptions,
  LLMStreamChunk,
} from '../types/index.js'
import { getGlobalRegistry } from '../providers/registry.js'
import { generateId } from '../utils/id.js'

export interface ChatMessage extends LLMMessage {
  id: string
  createdAt: Date
}

export interface UseChatOptions {
  providerId?: string
  initialMessages?: ChatMessage[]
  systemPrompt?: string
  completionOptions?: LLMCompletionOptions
  onChunk?: (chunk: LLMStreamChunk) => void
  onResponse?: (message: ChatMessage) => void
  onError?: (error: Error) => void
}

export interface UseChatResult {
  messages: ChatMessage[]
  isLoading: boolean
  isStreaming: boolean
  streamingContent: string
  error: Error | null
  sendMessage: (content: string) => Promise<void>
  regenerate: () => Promise<void>
  cancel: () => void
  clearMessages: () => void
  setMessages: (messages: ChatMessage[]) => void
}

export function useChat(options: UseChatOptions = {}): UseChatResult {
  const {
    providerId,
    initialMessages = [],
    systemPrompt,
    completionOptions = {},
    onChunk,
    onResponse,
    onError,
  } = options

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    async (content: string) => {
      const registry = getGlobalRegistry()
      const provider = registry.get(providerId)

      // Create user message
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content,
        createdAt: new Date(),
      }

      // Add user message to history
      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)

      setIsLoading(true)
      setIsStreaming(true)
      setError(null)
      setStreamingContent('')

      abortControllerRef.current = new AbortController()

      try {
        // Build LLM messages
        const llmMessages: LLMMessage[] = []

        if (systemPrompt) {
          llmMessages.push({ role: 'system', content: systemPrompt })
        }

        llmMessages.push(
          ...updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          }))
        )

        let assistantContent = ''

        for await (const chunk of provider.stream(llmMessages, {
          ...completionOptions,
          signal: abortControllerRef.current.signal,
        })) {
          assistantContent += chunk.content
          setStreamingContent(assistantContent)
          onChunk?.(chunk)

          if (chunk.done) {
            break
          }
        }

        // Create assistant message
        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: assistantContent,
          createdAt: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
        onResponse?.(assistantMessage)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Request was cancelled, don't treat as error
          return
        }
        const error = err instanceof Error ? err : new Error('Chat failed')
        setError(error)
        onError?.(error)
      } finally {
        setIsLoading(false)
        setIsStreaming(false)
        setStreamingContent('')
        abortControllerRef.current = null
      }
    },
    [providerId, messages, systemPrompt, completionOptions, onChunk, onResponse, onError]
  )

  const regenerate = useCallback(async () => {
    // Find last user message and remove the assistant response after it
    let lastUserIndex = -1
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserIndex = i
        break
      }
    }
    if (lastUserIndex === -1) return

    const lastUserMessage = messages[lastUserIndex]
    const messagesUpToLastUser = messages.slice(0, lastUserIndex)

    // Remove the last user message and any assistant response after it
    // sendMessage will re-add the user message
    setMessages(messagesUpToLastUser)

    // Re-send the last user message
    await sendMessage(lastUserMessage.content as string)
  }, [messages, sendMessage])

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    setStreamingContent('')
  }, [])

  return {
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    error,
    sendMessage,
    regenerate,
    cancel,
    clearMessages,
    setMessages,
  }
}
