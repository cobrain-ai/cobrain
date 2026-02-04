/**
 * CoBrain Sync Package
 * cr-sqlite CRDT synchronization engine and WebSocket client
 *
 * @license AGPL-3.0
 * @packageDocumentation
 */

// Types
export type {
  SyncChange,
  SerializedSyncChange,
  SyncConfig,
  SyncStats,
  SyncClientConfig,
  SyncState,
  SyncEvents,
  SyncMessageType,
  SyncMessage,
  AuthMessage,
  AuthOkMessage,
  PushMessage,
  PushOkMessage,
  PullMessage,
  PullOkMessage,
  ChangesMessage,
  ErrorMessage,
  AnyMessage,
} from './types.js'

// Engine
export { SyncEngine, createSyncEngine } from './engine.js'

// Client
export { SyncClient, createSyncClient } from './client.js'
