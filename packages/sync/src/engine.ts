/**
 * CoBrain Sync Engine
 * cr-sqlite CRDT operations for synchronization
 *
 * @license AGPL-3.0
 */

import type Database from 'better-sqlite3'
import type { SyncChange, SerializedSyncChange } from './types.js'

/**
 * Sync engine wrapping cr-sqlite operations
 */
export class SyncEngine {
  private sqlite: Database.Database
  private crdtEnabled: boolean = false

  constructor(sqlite: Database.Database) {
    this.sqlite = sqlite
    this.checkCrdtEnabled()
  }

  /**
   * Check if cr-sqlite is loaded
   */
  private checkCrdtEnabled(): void {
    try {
      const result = this.sqlite.prepare('SELECT crsql_site_id()').get() as { 'crsql_site_id()': Uint8Array } | undefined
      this.crdtEnabled = result !== undefined
    } catch {
      this.crdtEnabled = false
    }
  }

  /**
   * Whether cr-sqlite is enabled
   */
  get isCrdtEnabled(): boolean {
    return this.crdtEnabled
  }

  /**
   * Get the unique site ID for this database instance
   */
  getSiteId(): Uint8Array {
    if (!this.crdtEnabled) {
      throw new Error('cr-sqlite not enabled')
    }
    const result = this.sqlite.prepare('SELECT crsql_site_id()').get() as { 'crsql_site_id()': Uint8Array }
    return result['crsql_site_id()']
  }

  /**
   * Get the site ID as a hex string
   */
  getSiteIdHex(): string {
    const siteId = this.getSiteId()
    return Buffer.from(siteId).toString('hex')
  }

  /**
   * Get the current database version (monotonically increasing)
   */
  getDbVersion(): bigint {
    if (!this.crdtEnabled) {
      throw new Error('cr-sqlite not enabled')
    }
    const result = this.sqlite.prepare('SELECT crsql_db_version()').get() as { 'crsql_db_version()': bigint }
    return result['crsql_db_version()']
  }

  /**
   * Get all changes since a given version
   */
  getChangesSince(sinceVersion: bigint): SyncChange[] {
    if (!this.crdtEnabled) {
      throw new Error('cr-sqlite not enabled')
    }

    const stmt = this.sqlite.prepare(`
      SELECT "table", pk, cid, val, col_version, db_version, site_id, cl, seq
      FROM crsql_changes
      WHERE db_version > ?
      ORDER BY db_version ASC
    `)

    const rows = stmt.all(sinceVersion) as Array<{
      table: string
      pk: Uint8Array
      cid: string
      val: unknown
      col_version: bigint
      db_version: bigint
      site_id: Uint8Array
      cl: bigint
      seq: bigint
    }>

    return rows.map((row) => ({
      table: row.table,
      pk: row.pk,
      cid: row.cid,
      val: row.val,
      col_version: row.col_version,
      db_version: row.db_version,
      site_id: row.site_id,
      cl: row.cl,
      seq: row.seq,
    }))
  }

  /**
   * Apply changes from another device
   * Returns the number of changes applied
   */
  applyChanges(changes: SyncChange[]): number {
    if (!this.crdtEnabled) {
      throw new Error('cr-sqlite not enabled')
    }

    if (changes.length === 0) {
      return 0
    }

    const stmt = this.sqlite.prepare(`
      INSERT INTO crsql_changes ("table", pk, cid, val, col_version, db_version, site_id, cl, seq)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const applyAll = this.sqlite.transaction((changes: SyncChange[]) => {
      let count = 0
      for (const change of changes) {
        try {
          stmt.run(
            change.table,
            change.pk,
            change.cid,
            change.val,
            change.col_version,
            change.db_version,
            change.site_id,
            change.cl,
            change.seq
          )
          count++
        } catch (error) {
          // Log but continue - some changes might conflict
          console.warn('[sync] Failed to apply change:', error)
        }
      }
      return count
    })

    return applyAll(changes)
  }

  /**
   * Serialize changes for network transport
   */
  serializeChanges(changes: SyncChange[]): SerializedSyncChange[] {
    return changes.map((change) => ({
      table: change.table,
      pk: Buffer.from(change.pk).toString('base64'),
      cid: change.cid,
      val: change.val,
      col_version: change.col_version.toString(),
      db_version: change.db_version.toString(),
      site_id: Buffer.from(change.site_id).toString('base64'),
      cl: change.cl.toString(),
      seq: change.seq.toString(),
    }))
  }

  /**
   * Deserialize changes from network
   */
  deserializeChanges(serialized: SerializedSyncChange[]): SyncChange[] {
    return serialized.map((change) => ({
      table: change.table,
      pk: Buffer.from(change.pk, 'base64'),
      cid: change.cid,
      val: change.val,
      col_version: BigInt(change.col_version),
      db_version: BigInt(change.db_version),
      site_id: Buffer.from(change.site_id, 'base64'),
      cl: BigInt(change.cl),
      seq: BigInt(change.seq),
    }))
  }

  /**
   * Get the list of tables configured for CRDT sync
   */
  getSyncTables(): string[] {
    if (!this.crdtEnabled) {
      return []
    }

    try {
      const result = this.sqlite.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table'
        AND name NOT LIKE 'crsql_%'
        AND name NOT LIKE 'sqlite_%'
        AND name NOT LIKE '__drizzle_%'
      `).all() as Array<{ name: string }>

      // Check which tables are CRRs
      const syncTables: string[] = []
      for (const { name } of result) {
        try {
          // Try to select from the changes table for this table
          // This will fail if the table is not a CRR
          this.sqlite.prepare(`
            SELECT 1 FROM crsql_changes WHERE "table" = ? LIMIT 1
          `).get(name)
          syncTables.push(name)
        } catch {
          // Not a CRR table
        }
      }

      return syncTables
    } catch {
      return []
    }
  }

  /**
   * Finalize cr-sqlite (should be called before closing database)
   */
  finalize(): void {
    if (!this.crdtEnabled) {
      return
    }

    try {
      this.sqlite.prepare('SELECT crsql_finalize()').run()
    } catch (error) {
      console.warn('[sync] Failed to finalize cr-sqlite:', error)
    }
  }
}

/**
 * Create a sync engine from a database instance
 */
export function createSyncEngine(sqlite: Database.Database): SyncEngine {
  return new SyncEngine(sqlite)
}
