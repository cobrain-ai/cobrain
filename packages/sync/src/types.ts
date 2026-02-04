/**
 * CoBrain Sync Types
 * Types for cr-sqlite CRDT synchronization
 *
 * @license AGPL-3.0
 */

/**
 * A single change from cr-sqlite's crsql_changes table
 * Represents one column change with CRDT metadata
 */
export interface SyncChange {
  /** Table name */
  table: string
  /** Primary key of the row (encoded) */
  pk: Uint8Array
  /** Column name that changed */
  cid: string
  /** New value */
  val: unknown
  /** Column version (for conflict resolution) */
  col_version: bigint
  /** Database version when change was made */
  db_version: bigint
  /** Site ID that made the change */
  site_id: Uint8Array
  /** Causal length for ordering */
  cl: bigint
  /** Sequence number for ordering */
  seq: bigint
}

/**
 * Simplified change for network transport (JSON-serializable)
 */
export interface SerializedSyncChange {
  table: string
  pk: string // base64 encoded
  cid: string
  val: unknown
  col_version: string // bigint as string
  db_version: string // bigint as string
  site_id: string // base64 encoded
  cl: string // bigint as string
  seq: string // bigint as string
}

/**
 * Configuration for the sync engine
 */
export interface SyncConfig {
  /** Database path */
  dbPath?: string
  /** Whether cr-sqlite is enabled */
  crdtEnabled?: boolean
}

/**
 * Statistics returned after a sync operation
 */
export interface SyncStats {
  /** Number of changes pulled from server */
  pulled: number
  /** Number of changes pushed to server */
  pushed: number
  /** Timestamp of sync */
  syncedAt: Date
  /** Current local database version */
  localVersion: bigint
  /** Server database version */
  serverVersion?: bigint
}

/**
 * Sync client configuration
 */
export interface SyncClientConfig {
  /** WebSocket server URL */
  serverUrl: string
  /** Authentication token */
  authToken: string
  /** Device ID */
  deviceId: string
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean
  /** Reconnect delay in ms */
  reconnectDelay?: number
  /** Max reconnect attempts */
  maxReconnectAttempts?: number
  /** Debounce delay for push in ms */
  pushDebounceMs?: number
}

/**
 * Sync state
 */
export type SyncState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'syncing'
  | 'error'

/**
 * Sync event types
 */
export interface SyncEvents {
  stateChange: (state: SyncState) => void
  sync: (stats: SyncStats) => void
  error: (error: Error) => void
  conflict: (table: string, pk: unknown) => void
}

/**
 * WebSocket message types
 */
export type SyncMessageType =
  | 'auth'
  | 'auth_ok'
  | 'auth_error'
  | 'push'
  | 'push_ok'
  | 'pull'
  | 'pull_ok'
  | 'changes'
  | 'error'

/**
 * Base WebSocket message
 */
export interface SyncMessage {
  type: SyncMessageType
  requestId?: string
}

/**
 * Auth request
 */
export interface AuthMessage extends SyncMessage {
  type: 'auth'
  token: string
  deviceId: string
  siteId: string
}

/**
 * Auth success response
 */
export interface AuthOkMessage extends SyncMessage {
  type: 'auth_ok'
  userId: string
  serverVersion: string
}

/**
 * Push changes request
 */
export interface PushMessage extends SyncMessage {
  type: 'push'
  changes: SerializedSyncChange[]
  fromVersion: string
}

/**
 * Push success response
 */
export interface PushOkMessage extends SyncMessage {
  type: 'push_ok'
  applied: number
  serverVersion: string
}

/**
 * Pull changes request
 */
export interface PullMessage extends SyncMessage {
  type: 'pull'
  sinceVersion: string
}

/**
 * Pull success response with changes
 */
export interface PullOkMessage extends SyncMessage {
  type: 'pull_ok'
  changes: SerializedSyncChange[]
  serverVersion: string
}

/**
 * Server-pushed changes (real-time)
 */
export interface ChangesMessage extends SyncMessage {
  type: 'changes'
  changes: SerializedSyncChange[]
  fromDeviceId: string
}

/**
 * Error response
 */
export interface ErrorMessage extends SyncMessage {
  type: 'error' | 'auth_error'
  code: string
  message: string
}

/**
 * All possible messages
 */
export type AnyMessage =
  | AuthMessage
  | AuthOkMessage
  | PushMessage
  | PushOkMessage
  | PullMessage
  | PullOkMessage
  | ChangesMessage
  | ErrorMessage
