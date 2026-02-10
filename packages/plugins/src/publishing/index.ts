// Publishing Adapters - Service Registration
// Central export for all platform publishing adapters

export { ThreadsAdapter, createThreadsAdapter } from './threads/adapter.js'
export { HashnodeAdapter, createHashnodeAdapter } from './hashnode/adapter.js'
export { TwitterAdapter, createTwitterAdapter } from './twitter/adapter.js'

import type { PublishingServiceEntry } from '@cobrain/core'
import { createThreadsAdapter } from './threads/adapter.js'
import { createHashnodeAdapter } from './hashnode/adapter.js'
import { createTwitterAdapter } from './twitter/adapter.js'

/** All available publishing service entries */
export const publishingServices: PublishingServiceEntry[] = [
  {
    meta: {
      id: 'threads',
      name: 'Threads',
      category: 'social',
      icon: '🧵',
      characterLimit: 500,
      supportsMedia: true,
      supportsThreads: true,
      supportsScheduling: false,
      authType: 'oauth2',
    },
    factory: createThreadsAdapter,
  },
  {
    meta: {
      id: 'hashnode',
      name: 'Hashnode',
      category: 'developer',
      icon: '📝',
      supportsMedia: true,
      supportsThreads: false,
      supportsScheduling: false,
      authType: 'api_key',
    },
    factory: createHashnodeAdapter,
  },
  {
    meta: {
      id: 'twitter',
      name: 'Twitter / X',
      category: 'social',
      icon: '𝕏',
      characterLimit: 280,
      supportsMedia: true,
      supportsThreads: true,
      supportsScheduling: false,
      authType: 'oauth2',
    },
    factory: createTwitterAdapter,
  },
]

/**
 * Register all publishing services with the registry
 */
export function registerPublishingServices(
  register: (entry: PublishingServiceEntry) => void
): void {
  for (const entry of publishingServices) {
    register(entry)
  }
}
