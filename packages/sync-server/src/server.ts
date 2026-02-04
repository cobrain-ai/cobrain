/**
 * CoBrain Sync Server
 * WebSocket server for multi-device synchronization
 *
 * @license FSL-1.1-Apache-2.0
 */

import { WebSocketServer, WebSocket } from 'ws'
import type {
  AnyMessage,
  AuthMessage,
  AuthOkMessage,
  PushMessage,
  PushOkMessage,
  PullMessage,
  PullOkMessage,
  ChangesMessage,
  ErrorMessage,
} from '@cobrain/sync'
import type {
  SyncServerConfig,
  ConnectedClient,
  ServerStats,
  ChangeStore,
} from './types.js'
import { InMemoryChangeStore } from './store.js'

/**
 * WebSocket sync server
 */
export class SyncServer {
  private config: Required<SyncServerConfig>
  private wss: WebSocketServer | null = null
  private clients: Map<WebSocket, ConnectedClient> = new Map()
  private userConnections: Map<string, Set<WebSocket>> = new Map()
  private store: ChangeStore
  private startTime: number = 0
  private changesProcessed: number = 0
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null

  constructor(config: SyncServerConfig = {}, store?: ChangeStore) {
    this.config = {
      port: 8080,
      host: '0.0.0.0',
      authenticate: async () => null,
      maxConnectionsPerUser: 10,
      heartbeatInterval: 30000,
      connectionTimeout: 60000,
      ...config,
    }
    this.store = store ?? new InMemoryChangeStore()
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocketServer({
          port: this.config.port,
          host: this.config.host,
        })

        this.wss.on('connection', (ws) => {
          this.handleConnection(ws)
        })

        this.wss.on('error', (error) => {
          console.error('[sync-server] Server error:', error)
          reject(error)
        })

        this.wss.on('listening', () => {
          this.startTime = Date.now()
          console.log(
            `[sync-server] Listening on ${this.config.host}:${this.config.port}`
          )

          // Start heartbeat
          this.heartbeatTimer = setInterval(() => {
            this.heartbeat()
          }, this.config.heartbeatInterval)

          resolve()
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }

    // Close all client connections
    for (const ws of this.clients.keys()) {
      ws.close(1001, 'Server shutting down')
    }
    this.clients.clear()
    this.userConnections.clear()

    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close(() => {
          this.wss = null
          console.log('[sync-server] Server stopped')
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  /**
   * Get server statistics
   */
  getStats(): ServerStats {
    return {
      connectedClients: this.clients.size,
      uniqueUsers: this.userConnections.size,
      changesProcessed: this.changesProcessed,
      uptime: this.startTime > 0 ? Date.now() - this.startTime : 0,
    }
  }

  /**
   * Set a custom change store
   */
  setStore(store: ChangeStore): void {
    this.store = store
  }

  // Private methods

  private handleConnection(ws: WebSocket): void {
    console.log('[sync-server] New connection')

    // Set up message handler
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString()) as AnyMessage
        await this.handleMessage(ws, message)
      } catch (error) {
        console.error('[sync-server] Failed to parse message:', error)
        this.sendError(ws, 'PARSE_ERROR', 'Failed to parse message')
      }
    })

    // Set up close handler
    ws.on('close', () => {
      this.handleDisconnect(ws)
    })

    // Set up error handler
    ws.on('error', (error) => {
      console.error('[sync-server] Client error:', error)
      this.handleDisconnect(ws)
    })

    // Set authentication timeout
    setTimeout(() => {
      if (!this.clients.has(ws)) {
        console.log('[sync-server] Auth timeout, closing connection')
        ws.close(4001, 'Authentication timeout')
      }
    }, 10000)
  }

  private handleDisconnect(ws: WebSocket): void {
    const client = this.clients.get(ws)
    if (client) {
      console.log(`[sync-server] Client disconnected: ${client.userId}/${client.deviceId}`)

      // Remove from user connections
      const userSockets = this.userConnections.get(client.userId)
      if (userSockets) {
        userSockets.delete(ws)
        if (userSockets.size === 0) {
          this.userConnections.delete(client.userId)
        }
      }

      this.clients.delete(ws)
    }
  }

  private async handleMessage(ws: WebSocket, message: AnyMessage): Promise<void> {
    switch (message.type) {
      case 'auth':
        await this.handleAuth(ws, message as AuthMessage)
        break

      case 'push':
        await this.handlePush(ws, message as PushMessage)
        break

      case 'pull':
        await this.handlePull(ws, message as PullMessage)
        break

      default:
        this.sendError(ws, 'UNKNOWN_MESSAGE', `Unknown message type: ${message.type}`)
    }
  }

  private async handleAuth(ws: WebSocket, message: AuthMessage): Promise<void> {
    // Validate token
    const authResult = await this.config.authenticate(message.token)
    if (!authResult) {
      this.send(ws, {
        type: 'auth_error',
        requestId: message.requestId,
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      } as ErrorMessage)
      ws.close(4002, 'Authentication failed')
      return
    }

    // Check max connections per user
    const existingConnections = this.userConnections.get(authResult.userId)
    if (existingConnections && existingConnections.size >= this.config.maxConnectionsPerUser) {
      this.send(ws, {
        type: 'auth_error',
        requestId: message.requestId,
        code: 'TOO_MANY_CONNECTIONS',
        message: 'Maximum connections exceeded',
      } as ErrorMessage)
      ws.close(4003, 'Too many connections')
      return
    }

    // Register client
    const client: ConnectedClient = {
      id: crypto.randomUUID(),
      userId: authResult.userId,
      deviceId: message.deviceId,
      siteId: message.siteId,
      connectedAt: new Date(),
      lastVersion: 0n,
    }
    this.clients.set(ws, client)

    // Track user connections
    if (!this.userConnections.has(client.userId)) {
      this.userConnections.set(client.userId, new Set())
    }
    this.userConnections.get(client.userId)!.add(ws)

    // Get current version for user
    const currentVersion = await this.store.getCurrentVersion(client.userId)

    console.log(
      `[sync-server] Client authenticated: ${client.userId}/${client.deviceId}`
    )

    // Send auth success
    this.send(ws, {
      type: 'auth_ok',
      requestId: message.requestId,
      userId: client.userId,
      serverVersion: currentVersion.toString(),
    } as AuthOkMessage)
  }

  private async handlePush(ws: WebSocket, message: PushMessage): Promise<void> {
    const client = this.clients.get(ws)
    if (!client) {
      this.sendError(ws, 'NOT_AUTHENTICATED', 'Not authenticated', message.requestId)
      return
    }

    if (message.changes.length === 0) {
      this.send(ws, {
        type: 'push_ok',
        requestId: message.requestId,
        applied: 0,
        serverVersion: (await this.store.getCurrentVersion(client.userId)).toString(),
      } as PushOkMessage)
      return
    }

    // Store changes
    const newVersion = await this.store.storeChanges(client.userId, message.changes)
    this.changesProcessed += message.changes.length

    console.log(
      `[sync-server] Received ${message.changes.length} changes from ${client.userId}/${client.deviceId}`
    )

    // Send success response
    this.send(ws, {
      type: 'push_ok',
      requestId: message.requestId,
      applied: message.changes.length,
      serverVersion: newVersion.toString(),
    } as PushOkMessage)

    // Broadcast to other devices of the same user
    this.broadcastToUser(client.userId, ws, {
      type: 'changes',
      changes: message.changes,
      fromDeviceId: client.deviceId,
    } as ChangesMessage)
  }

  private async handlePull(ws: WebSocket, message: PullMessage): Promise<void> {
    const client = this.clients.get(ws)
    if (!client) {
      this.sendError(ws, 'NOT_AUTHENTICATED', 'Not authenticated', message.requestId)
      return
    }

    const sinceVersion = BigInt(message.sinceVersion)
    const { changes, currentVersion } = await this.store.getChangesSince(
      client.userId,
      sinceVersion
    )

    console.log(
      `[sync-server] Sending ${changes.length} changes to ${client.userId}/${client.deviceId}`
    )

    this.send(ws, {
      type: 'pull_ok',
      requestId: message.requestId,
      changes,
      serverVersion: currentVersion.toString(),
    } as PullOkMessage)
  }

  private broadcastToUser(
    userId: string,
    excludeWs: WebSocket,
    message: AnyMessage
  ): void {
    const userSockets = this.userConnections.get(userId)
    if (!userSockets) return

    const data = JSON.stringify(message)
    for (const ws of userSockets) {
      if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        ws.send(data)
      }
    }
  }

  private send(ws: WebSocket, message: AnyMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  private sendError(
    ws: WebSocket,
    code: string,
    message: string,
    requestId?: string
  ): void {
    this.send(ws, {
      type: 'error',
      requestId,
      code,
      message,
    } as ErrorMessage)
  }

  private heartbeat(): void {
    const now = Date.now()
    for (const [ws, client] of this.clients) {
      const age = now - client.connectedAt.getTime()
      if (age > this.config.connectionTimeout) {
        // Check if still alive
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping()
        }
      }
    }
  }
}

/**
 * Create a sync server
 */
export function createSyncServer(
  config?: SyncServerConfig,
  store?: ChangeStore
): SyncServer {
  return new SyncServer(config, store)
}
