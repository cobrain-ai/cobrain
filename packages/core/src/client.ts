'use client'

// Client-only exports - React hooks that require "use client"
// Import from '@cobrain/core/client' in client components

export { useProvider } from './hooks/use-provider.js'
export type { UseProviderOptions, UseProviderResult } from './hooks/use-provider.js'

export { useCompletion } from './hooks/use-completion.js'
export type { UseCompletionOptions, UseCompletionResult } from './hooks/use-completion.js'

export { useChat } from './hooks/use-chat.js'
export type { UseChatOptions, UseChatResult, ChatMessage } from './hooks/use-chat.js'
