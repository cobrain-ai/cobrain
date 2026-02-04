/**
 * CoBrain Sync Server Types
 *
 * @license FSL-1.1-Apache-2.0
 */

import type { SerializedSyncChange } from '@cobrain/sync'

/**
 * Server configuration
 */
export interface SyncServerConfig {
  /** Port to listen on */
  port?: number
  /** Host to bind to */
  host?: string
  /** Authentication function */
  authenticate?: (token: string) => Promise<AuthResult | null>
  /** Maximum connections per user */
  maxConnectionsPerUser?: number
  /** Heartbeat interval in ms */
  heartbeatInterval?: number
  /** Connection timeout in ms */
  connectionTimeout?: number
}

/**
 * Authentication result
 */
export interface AuthResult {
  userId: string
  deviceId?: string
}

/**
 * Connected client
 */
export interface ConnectedClient {
  id: string
  userId: string
  deviceId: string
  siteId: string
  connectedAt: Date
  lastVersion: bigint
}

/**
 * Server statistics
 */
export interface ServerStats {
  /** Total connected clients */
  connectedClients: number
  /** Unique users */
  uniqueUsers: number
  /** Total changes processed */
  changesProcessed: number
  /** Server uptime in ms */
  uptime: number
}

/**
 * Change storage interface
 */
export interface ChangeStore {
  /** Store changes from a client */
  storeChanges(userId: string, changes: SerializedSyncChange[]): Promise<bigint>

  /** Get changes since a version for a user */
  getChangesSince(userId: string, sinceVersion: bigint): Promise<{
    changes: SerializedSyncChange[]
    currentVersion: bigint
  }>

  /** Get current version for a user */
  getCurrentVersion(userId: string): Promise<bigint>
}

/**
 * In-memory change store (for development/testing)
 */
export interface InMemoryChangeStoreData {
  changes: SerializedSyncChange[]
  version: bigint
}
