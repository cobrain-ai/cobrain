# Database Synchronization Architecture

## Overview

This document describes the architecture for multi-device database synchronization in CoBrain. The system uses CRDTs (Conflict-free Replicated Data Types) via cr-sqlite to enable seamless sync across devices with automatic conflict resolution.

## Goals

1. **Multi-device sync** for same user across phone, desktop, tablet
2. **Offline-first** - full functionality without internet
3. **Automatic conflict resolution** using CRDTs
4. **Real-time sync** via WebSocket server
5. **Self-hostable** - users can run their own sync server
6. **Open source** - all code public under AGPL-3.0

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  SINGLE PUBLIC REPO: cobrain                               │
│                                                             │
│  packages/                                                  │
│  ├── core/              AGPL-3.0   ← LLM abstraction       │
│  ├── database/          AGPL-3.0   ← Drizzle + cr-sqlite   │
│  ├── ai/                AGPL-3.0   ← AI extraction         │
│  ├── sync/              AGPL-3.0   ← Sync engine + client  │
│  └── sync-server/       FSL        ← Premium: WS server    │
│                                                             │
│  All code is PUBLIC and viewable                           │
│  FSL packages: self-hosting allowed, commercial use blocked│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Component | Current | Target |
|-----------|---------|--------|
| **ORM** | Prisma | Drizzle |
| **Database** | SQLite | SQLite + cr-sqlite |
| **CRDT** | None | cr-sqlite |
| **Sync** | None | WebSocket server |

## Database Migration: Prisma to Drizzle

### Why Drizzle?

Prisma does not support:
- Loading SQLite extensions (required for cr-sqlite)
- Lifecycle hooks for connection open/close
- Custom SQLite pragmas at connection time

Drizzle with better-sqlite3 allows full cr-sqlite integration.

### Schema Conversion

The Drizzle schema mirrors the existing Prisma schema with these additions:

```typescript
// packages/database/drizzle/schema.ts

// NEW: Sync devices
export const devices = sqliteTable('devices', {
  id: text('id').primaryKey().notNull(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  platform: text('platform').notNull(), // web, ios, android, desktop
  lastSyncAt: integer('last_sync_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});
```

### Database Client with cr-sqlite

```typescript
// packages/database/src/client.ts

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { extensionPath } from '@vlcn.io/crsqlite';

const SYNC_TABLES = [
  'users', 'notes', 'entities', 'note_entities',
  'entity_relations', 'reminders', 'views',
  'view_snapshots', 'devices'
];

export async function initDatabase(dbPath = 'cobrain.db') {
  const sqlite = new Database(dbPath);

  // Load cr-sqlite extension FIRST
  sqlite.loadExtension(extensionPath);
  sqlite.pragma('journal_mode = WAL');

  const db = drizzle(sqlite, { schema });

  // Enable CRDT on all sync tables
  for (const table of SYNC_TABLES) {
    sqlite.exec(`SELECT crsql_as_crr('${table}')`);
  }

  return { db, sqlite };
}
```

## Sync Packages

### @cobrain/sync (AGPL-3.0)

Sync engine with cr-sqlite operations and WebSocket client.

```typescript
// Engine functions
export function getSiteId(): string;
export function getDbVersion(): number;
export function getChangesSince(version: number): SyncChange[];
export function applyChanges(changes: SyncChange[]): number;

// WebSocket sync client
export class SyncClient {
  constructor(serverUrl: string, authToken: string);
  connect(): Promise<void>;
  disconnect(): void;
  sync(): Promise<{ pulled: number; pushed: number }>;
  onSync(callback: (stats: SyncStats) => void): void;
}
```

### @cobrain/sync-server (FSL)

Self-hostable WebSocket server for real-time sync. Licensed under FSL (Functional Source License):
- Code is public and viewable
- Self-hosting for personal/internal use is allowed
- Commercial sync services are blocked for 2 years
- Converts to Apache 2.0 after 2 years

```typescript
import { SyncServer } from '@cobrain/sync-server';

const server = new SyncServer({
  port: 8080,
  auth: validateToken, // Your auth function
});
await server.start();
```

## Sync Flow

```
User Types → Local DB → cr-sqlite tracks changes
                ↓
        Debounced (5 seconds)
                ↓
    WebSocket push to server
                ↓
    Server broadcasts to other devices
                ↓
    Real-time apply via CRDT
```

## Conflict Resolution

cr-sqlite uses **Last-Write-Wins (LWW)** at the column level:

| Scenario | Resolution |
|----------|------------|
| Same field edited on two devices | Higher timestamp wins |
| Different fields edited | Both changes preserved |
| Record deleted on one, edited on other | Delete wins (tombstone) |

This is simpler than full CRDT text merging but sufficient for note-taking where same-field conflicts are rare in single-user scenarios.

## Package Structure

```
cobrain/
├── packages/
│   ├── core/                         LICENSE: AGPL-3.0
│   ├── database/                     LICENSE: AGPL-3.0
│   │   ├── drizzle/
│   │   │   ├── schema.ts
│   │   │   └── migrations/
│   │   └── src/
│   │       ├── client.ts
│   │       └── repositories/
│   │
│   ├── sync/                         LICENSE: AGPL-3.0
│   │   └── src/
│   │       ├── engine.ts
│   │       ├── client.ts
│   │       ├── types.ts
│   │       └── index.ts
│   │
│   └── sync-server/                  LICENSE: FSL
│       ├── LICENSE                   (FSL license text)
│       └── src/
│           ├── server.ts
│           ├── auth.ts
│           └── index.ts
│
├── apps/
│   └── web/                          LICENSE: AGPL-3.0
│
├── LICENSE                           (AGPL-3.0 - default)
└── README.md
```

## Dependencies

### To Install

```json
{
  "dependencies": {
    "better-sqlite3": "^11.0.0",
    "drizzle-orm": "^0.38.0",
    "@vlcn.io/crsqlite": "^0.16.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.30.0",
    "@types/better-sqlite3": "^7.6.0"
  }
}
```

### To Remove

```json
{
  "dependencies": {
    "@prisma/client": "REMOVE"
  },
  "devDependencies": {
    "prisma": "REMOVE"
  }
}
```

## Migration Steps

| Phase | Step | Task |
|-------|------|------|
| **1. Database** | 1.1 | Install Drizzle, better-sqlite3, cr-sqlite |
| | 1.2 | Create Drizzle schema |
| | 1.3 | Create client.ts with cr-sqlite |
| | 1.4 | Migrate repositories to Drizzle |
| **2. Sync** | 2.1 | Create `sync` package |
| | 2.2 | Implement engine, types, client |
| **3. Sync Server** | 3.1 | Create `sync-server` package |
| | 3.2 | Implement WebSocket server with auth |
| **4. Integration** | 4.1 | Update app with sync settings |
| | 4.2 | Remove Prisma |
| | 4.3 | Test all sync functionality |

## Self-Hosting

Users can run their own sync server:

```bash
# Clone the repo
git clone https://github.com/cobrain-ai/cobrain.git
cd cobrain

# Install dependencies
pnpm install

# Build sync server
pnpm --filter @cobrain/sync-server build

# Run server
cd packages/sync-server
node dist/index.js
```

Or use Docker:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY packages/sync-server/dist ./
EXPOSE 8080
CMD ["node", "index.js"]
```

## References

- [cr-sqlite Documentation](https://vlcn.io/docs/cr-sqlite/intro)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Local-first software](https://www.inkandswitch.com/local-first/)
- [Linear's sync architecture](https://marknotfound.com/posts/reverse-engineering-linears-sync-magic/)

## Open Questions

1. **Log compaction** - How often to compact CRDT history?
2. **Large files** - Should embeddings sync or regenerate locally?
3. **Selective sync** - Allow syncing only certain note types?
4. **Encryption** - End-to-end encryption for sync data?

---

*Last updated: 2026-02-05*
