#!/usr/bin/env node
/**
 * CoBrain Sync Server CLI
 *
 * @license FSL-1.1-Apache-2.0
 */

import { createSyncServer } from './server.js'
import { createInMemoryStore } from './store.js'

// Parse command line arguments
const args = process.argv.slice(2)
const port = parseInt(args.find((a) => a.startsWith('--port='))?.split('=')[1] ?? '8080', 10)
const host = args.find((a) => a.startsWith('--host='))?.split('=')[1] ?? '0.0.0.0'

// Simple token-based auth for development
// In production, integrate with your auth system
const validTokens = new Map<string, string>()

// Add tokens from environment variable (comma-separated userId:token pairs)
const envTokens = process.env.SYNC_AUTH_TOKENS ?? ''
for (const pair of envTokens.split(',').filter(Boolean)) {
  const [userId, token] = pair.split(':')
  if (userId && token) {
    validTokens.set(token, userId)
  }
}

// If no tokens configured, use a default dev token
if (validTokens.size === 0) {
  console.warn('[sync-server] Warning: No auth tokens configured, using dev token')
  validTokens.set('dev-token', 'dev-user')
}

// Create server
const store = createInMemoryStore()
const server = createSyncServer(
  {
    port,
    host,
    authenticate: async (token) => {
      const userId = validTokens.get(token)
      if (userId) {
        return { userId }
      }
      return null
    },
  },
  store
)

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('\n[sync-server] Shutting down...')
  await server.stop()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('[sync-server] Received SIGTERM, shutting down...')
  await server.stop()
  process.exit(0)
})

// Start server
console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                   CoBrain Sync Server                         ║
║                                                               ║
║  License: FSL-1.1-Apache-2.0                                  ║
║  - Self-hosting for personal use: ✓ Allowed                  ║
║  - Commercial sync services: ✗ Prohibited for 2 years        ║
║  See LICENSE file for full terms.                             ║
╚═══════════════════════════════════════════════════════════════╝
`)

server.start().then(() => {
  console.log(`[sync-server] Server ready at ws://${host}:${port}`)
  console.log(`[sync-server] Auth tokens configured: ${validTokens.size}`)

  // Log stats periodically
  setInterval(() => {
    const stats = server.getStats()
    console.log(
      `[sync-server] Stats: ${stats.connectedClients} clients, ` +
      `${stats.uniqueUsers} users, ${stats.changesProcessed} changes, ` +
      `uptime ${Math.round(stats.uptime / 1000 / 60)}m`
    )
  }, 60000)
}).catch((error) => {
  console.error('[sync-server] Failed to start:', error)
  process.exit(1)
})
