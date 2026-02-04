/**
 * CoBrain Sync Server
 * WebSocket server for multi-device synchronization
 *
 * @license FSL-1.1-Apache-2.0
 *
 * This package is licensed under the Functional Source License (FSL).
 * - Self-hosting for personal/internal use is allowed
 * - Commercial sync services are prohibited for 2 years
 * - Converts to Apache 2.0 after 2 years
 *
 * See LICENSE file for full terms.
 *
 * @packageDocumentation
 */

// Types
export type {
  SyncServerConfig,
  AuthResult,
  ConnectedClient,
  ServerStats,
  ChangeStore,
  InMemoryChangeStoreData,
} from './types.js'

// Server
export { SyncServer, createSyncServer } from './server.js'

// Store
export { InMemoryChangeStore, createInMemoryStore } from './store.js'
