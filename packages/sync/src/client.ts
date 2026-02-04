/**
 * CoBrain Sync Client
 * WebSocket client for real-time synchronization
 *
 * @license AGPL-3.0
 */

import type {
  SyncClientConfig,
  SyncState,
  SyncStats,
  SyncEvents,
  AnyMessage,
  AuthMessage,
  PushMessage,
  PullMessage,
} from './types.js'
import type { SyncEngine } from './engine.js'

/**
 * WebSocket sync client for connecting to a sync server
 */
export class SyncClient {
  private config: Required<SyncClientConfig>
  private engine: SyncEngine
  private ws: WebSocket | null = null
  private state: SyncState = 'disconnected'
  private listeners: Map<keyof SyncEvents, Set<SyncEvents[keyof SyncEvents]>> = new Map()
  private reconnectAttempts = 0
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private pushTimeout: ReturnType<typeof setTimeout> | null = null
  private lastSyncVersion: bigint = 0n
  private pendingRequests: Map<string, { resolve: (msg: AnyMessage) => void; reject: (err: Error) => void }> = new Map()
  private requestCounter = 0

  constructor(config: SyncClientConfig, engine: SyncEngine) {
    this.config = {
      autoReconnect: true,
      reconnectDelay: 1000,
      maxReconnectAttempts: 10,
      pushDebounceMs: 5000,
      ...config,
    }
    this.engine = engine
  }

  /**
   * Current sync state
   */
  get currentState(): SyncState {
    return this.state
  }

  /**
   * Whether the client is connected
   */
  get isConnected(): boolean {
    return this.state === 'connected' || this.state === 'syncing'
  }

  /**
   * Connect to the sync server
   */
  async connect(): Promise<void> {
    if (this.ws) {
      return
    }

    this.setState('connecting')

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.serverUrl)

        this.ws.onopen = () => {
          this.authenticate().then(resolve).catch(reject)
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data as string)
        }

        this.ws.onerror = (event) => {
          console.error('[sync] WebSocket error:', event)
          this.emitError(new Error('WebSocket error'))
        }

        this.ws.onclose = () => {
          this.handleDisconnect()
        }
      } catch (error) {
        this.setState('error')
        reject(error)
      }
    })
  }

  /**
   * Disconnect from the sync server
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.pushTimeout) {
      clearTimeout(this.pushTimeout)
      this.pushTimeout = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.setState('disconnected')
    this.reconnectAttempts = 0
  }

  /**
   * Perform a full sync (push + pull)
   */
  async sync(): Promise<SyncStats> {
    if (!this.isConnected) {
      throw new Error('Not connected to sync server')
    }

    this.setState('syncing')

    try {
      // Push local changes first
      const pushed = await this.push()

      // Then pull remote changes
      const pulled = await this.pull()

      const stats: SyncStats = {
        pulled,
        pushed,
        syncedAt: new Date(),
        localVersion: this.engine.getDbVersion(),
      }

      this.setState('connected')
      this.emitSync(stats)

      return stats
    } catch (error) {
      this.setState('error')
      throw error
    }
  }

  /**
   * Push local changes to server
   */
  async push(): Promise<number> {
    const changes = this.engine.getChangesSince(this.lastSyncVersion)
    if (changes.length === 0) {
      return 0
    }

    const serialized = this.engine.serializeChanges(changes)
    const message: PushMessage = {
      type: 'push',
      requestId: this.nextRequestId(),
      changes: serialized,
      fromVersion: this.lastSyncVersion.toString(),
    }

    const response = await this.sendRequest(message)
    if (response.type === 'push_ok') {
      this.lastSyncVersion = BigInt(response.serverVersion)
      return response.applied
    }

    throw new Error('Push failed')
  }

  /**
   * Pull remote changes from server
   */
  async pull(): Promise<number> {
    const message: PullMessage = {
      type: 'pull',
      requestId: this.nextRequestId(),
      sinceVersion: this.lastSyncVersion.toString(),
    }

    const response = await this.sendRequest(message)
    if (response.type === 'pull_ok') {
      const changes = this.engine.deserializeChanges(response.changes)
      const applied = this.engine.applyChanges(changes)
      this.lastSyncVersion = BigInt(response.serverVersion)
      return applied
    }

    throw new Error('Pull failed')
  }

  /**
   * Schedule a debounced push (for real-time updates)
   */
  schedulePush(): void {
    if (this.pushTimeout) {
      clearTimeout(this.pushTimeout)
    }

    this.pushTimeout = setTimeout(() => {
      this.push().catch((err) => {
        console.error('[sync] Auto-push failed:', err)
      })
    }, this.config.pushDebounceMs)
  }

  /**
   * Register an event listener
   */
  on<K extends keyof SyncEvents>(event: K, callback: SyncEvents[K]): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback as SyncEvents[keyof SyncEvents])

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback as SyncEvents[keyof SyncEvents])
    }
  }

  /**
   * Remove an event listener
   */
  off<K extends keyof SyncEvents>(event: K, callback: SyncEvents[K]): void {
    this.listeners.get(event)?.delete(callback as SyncEvents[keyof SyncEvents])
  }

  // Private methods

  private async authenticate(): Promise<void> {
    const siteId = this.engine.getSiteIdHex()
    const message: AuthMessage = {
      type: 'auth',
      token: this.config.authToken,
      deviceId: this.config.deviceId,
      siteId,
    }

    const response = await this.sendRequest(message)
    if (response.type === 'auth_ok') {
      this.setState('connected')
      this.reconnectAttempts = 0
      this.lastSyncVersion = BigInt(response.serverVersion)
    } else if (response.type === 'auth_error' || response.type === 'error') {
      throw new Error(response.message)
    }
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as AnyMessage

      // Handle responses to pending requests
      if (message.requestId && this.pendingRequests.has(message.requestId)) {
        const { resolve } = this.pendingRequests.get(message.requestId)!
        this.pendingRequests.delete(message.requestId)
        resolve(message)
        return
      }

      // Handle server-pushed messages
      switch (message.type) {
        case 'changes':
          // Real-time changes from another device
          const changes = this.engine.deserializeChanges(message.changes)
          const applied = this.engine.applyChanges(changes)
          if (applied > 0) {
            this.emitSync({
              pulled: applied,
              pushed: 0,
              syncedAt: new Date(),
              localVersion: this.engine.getDbVersion(),
            })
          }
          break

        case 'error':
          this.emitError(new Error(message.message))
          break
      }
    } catch (error) {
      console.error('[sync] Failed to parse message:', error)
    }
  }

  private handleDisconnect(): void {
    this.ws = null

    // Reject all pending requests
    for (const [, { reject }] of this.pendingRequests) {
      reject(new Error('Disconnected'))
    }
    this.pendingRequests.clear()

    if (this.state !== 'disconnected' && this.config.autoReconnect) {
      this.scheduleReconnect()
    } else {
      this.setState('disconnected')
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.setState('error')
      this.emitError(new Error('Max reconnect attempts reached'))
      return
    }

    this.reconnectAttempts++
    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    console.log(`[sync] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch((err) => {
        console.error('[sync] Reconnect failed:', err)
      })
    }, delay)
  }

  private sendRequest(message: AnyMessage): Promise<AnyMessage> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('Not connected'))
        return
      }

      const requestId = message.requestId ?? this.nextRequestId()
      const fullMessage = { ...message, requestId }

      this.pendingRequests.set(requestId, { resolve, reject })

      // Set timeout for request
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId)
          reject(new Error('Request timeout'))
        }
      }, 30000)

      this.ws.send(JSON.stringify(fullMessage))
    })
  }

  private nextRequestId(): string {
    return `req_${++this.requestCounter}_${Date.now()}`
  }

  private setState(state: SyncState): void {
    if (this.state !== state) {
      this.state = state
      this.emit('stateChange', state)
    }
  }

  private emit<K extends keyof SyncEvents>(event: K, ...args: Parameters<SyncEvents[K]>): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          (callback as (...args: Parameters<SyncEvents[K]>) => void)(...args)
        } catch (error) {
          console.error(`[sync] Error in ${event} listener:`, error)
        }
      }
    }
  }

  private emitSync(stats: SyncStats): void {
    this.emit('sync', stats)
  }

  private emitError(error: Error): void {
    this.emit('error', error)
  }
}

/**
 * Create a sync client
 */
export function createSyncClient(config: SyncClientConfig, engine: SyncEngine): SyncClient {
  return new SyncClient(config, engine)
}
