/**
 * CoBrain Sync Server - Change Store
 * Storage for sync changes
 *
 * @license FSL-1.1-Apache-2.0
 */

import type { SerializedSyncChange } from '@cobrain/sync'
import type { ChangeStore, InMemoryChangeStoreData } from './types.js'

/**
 * In-memory change store for development and testing
 * For production, implement a persistent store (Redis, PostgreSQL, etc.)
 */
export class InMemoryChangeStore implements ChangeStore {
  private store: Map<string, InMemoryChangeStoreData> = new Map()

  async storeChanges(userId: string, changes: SerializedSyncChange[]): Promise<bigint> {
    let userData = this.store.get(userId)
    if (!userData) {
      userData = { changes: [], version: 0n }
      this.store.set(userId, userData)
    }

    // Append changes and increment version
    userData.changes.push(...changes)
    userData.version += BigInt(changes.length)

    return userData.version
  }

  async getChangesSince(
    userId: string,
    sinceVersion: bigint
  ): Promise<{ changes: SerializedSyncChange[]; currentVersion: bigint }> {
    const userData = this.store.get(userId)
    if (!userData) {
      return { changes: [], currentVersion: 0n }
    }

    // Filter changes after sinceVersion
    // Note: In a real implementation, each change would have a version number
    const startIndex = Number(sinceVersion)
    const changes = userData.changes.slice(startIndex)

    return {
      changes,
      currentVersion: userData.version,
    }
  }

  async getCurrentVersion(userId: string): Promise<bigint> {
    const userData = this.store.get(userId)
    return userData?.version ?? 0n
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.store.clear()
  }

  /**
   * Get stats
   */
  getStats(): { users: number; totalChanges: number } {
    let totalChanges = 0
    for (const data of this.store.values()) {
      totalChanges += data.changes.length
    }
    return {
      users: this.store.size,
      totalChanges,
    }
  }
}

/**
 * Create an in-memory change store
 */
export function createInMemoryStore(): InMemoryChangeStore {
  return new InMemoryChangeStore()
}
