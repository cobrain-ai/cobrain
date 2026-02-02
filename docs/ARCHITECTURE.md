# Second Brain App - Technical Architecture
## Multi-Platform React Strategy (Web → Desktop → Mobile)

**Last Updated:** 2026-02-02
**Status:** Architecture Planning
**Platform Strategy:** Web-first → Electron Desktop → React Native Mobile

---

## 1. Architecture Overview

### 1.1 Platform Targets

```
┌─────────────────────────────────────────────────────────────┐
│                    SHARED BUSINESS LOGIC                     │
│           (TypeScript, Platform-Agnostic Core)               │
│                                                              │
│  • AI Processing Logic    • Graph Database Operations       │
│  • Entity Extraction      • Semantic Search Engine          │
│  • Query Parser          • Notification Scheduler            │
└──────────────────┬───────────────────────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼────┐   ┌────▼─────┐   ┌───▼─────┐
│  WEB   │   │ DESKTOP  │   │ MOBILE  │
│ React  │   │ Electron │   │  React  │
│Next.js │   │  React   │   │ Native  │
└────────┘   └──────────┘   └─────────┘
```

### 1.2 Development Phases

**Phase 1: Web App (Months 1-3)**
- Next.js React app with full functionality
- PWA capabilities for mobile web
- Core AI features and graph database
- Launch MVP for early adopters

**Phase 2: Desktop App (Months 4-5)**
- Wrap web app in Electron/Tauri
- Add desktop-specific features (global shortcuts, system tray)
- Local AI model integration
- Offline-first capabilities

**Phase 3: Mobile Apps (Months 6-8)**
- React Native for iOS and Android
- Reuse business logic from web
- Mobile-optimized UI components
- Voice capture and quick input widgets

---

## 2. Monorepo Structure

### 2.1 Recommended Structure (Turborepo/Nx)

```
second-brain/
├── apps/
│   ├── web/                    # Next.js web application
│   │   ├── src/
│   │   │   ├── app/           # Next.js App Router
│   │   │   ├── components/    # Web-specific components
│   │   │   └── styles/
│   │   ├── public/
│   │   ├── next.config.js
│   │   └── package.json
│   │
│   ├── desktop/               # Electron wrapper
│   │   ├── electron/          # Main process
│   │   ├── src/              # Renderer (reuses web components)
│   │   └── package.json
│   │
│   └── mobile/               # React Native app
│       ├── src/
│       │   ├── screens/
│       │   ├── components/    # Mobile-specific components
│       │   └── navigation/
│       ├── ios/
│       ├── android/
│       └── package.json
│
├── packages/
│   ├── core/                  # Platform-agnostic business logic
│   │   ├── src/
│   │   │   ├── ai/           # AI processing, entity extraction
│   │   │   ├── graph/        # Graph database operations
│   │   │   ├── search/       # Semantic search engine
│   │   │   ├── query/        # Query parser
│   │   │   ├── notifications/ # Notification logic
│   │   │   └── types/        # Shared TypeScript types
│   │   └── package.json
│   │
│   ├── ui/                    # Shared React components
│   │   ├── src/
│   │   │   ├── components/   # Cross-platform components
│   │   │   ├── hooks/        # Shared React hooks
│   │   │   └── utils/
│   │   └── package.json
│   │
│   ├── database/             # Database abstraction layer
│   │   ├── src/
│   │   │   ├── graph/        # Graph DB client (Neo4j/DGraph)
│   │   │   ├── vector/       # Vector DB client
│   │   │   ├── sync/         # Sync engine
│   │   │   └── schema/
│   │   └── package.json
│   │
│   ├── api-client/           # Backend API client
│   │   ├── src/
│   │   │   ├── endpoints/
│   │   │   ├── types/
│   │   │   └── hooks/
│   │   └── package.json
│   │
│   └── config/               # Shared configuration
│       ├── eslint-config/
│       ├── typescript-config/
│       └── prettier-config/
│
├── services/                 # Backend services
│   ├── api/                  # Main API server (Node.js/FastAPI)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── middleware/
│   │   │   └── ai/           # AI processing workers
│   │   └── package.json
│   │
│   └── sync-service/         # Real-time sync service
│       └── src/
│
├── turbo.json                # Turborepo config
├── package.json              # Root package.json
└── README.md
```

---

## 3. Technology Stack

### 3.1 Frontend Platforms

| Platform | Technology | Reasoning |
|----------|-----------|-----------|
| **Web** | Next.js 15 (App Router) + React 19 | SSR, RSC, best DX, easy deployment |
| **Desktop** | Electron or Tauri + React | Reuse web components, native features |
| **Mobile** | React Native (Expo) | Code reuse, native performance |
| **Styling** | Tailwind CSS + shadcn/ui | Consistent design system, highly customizable |
| **State Management** | Zustand + React Query | Simple, performant, great for async state |

### 3.2 Backend & Data Layer

| Component | Technology | Reasoning |
|-----------|-----------|-----------|
| **API Server** | Node.js + Fastify or Python + FastAPI | Fast, async, good TypeScript support |
| **Graph Database** | Neo4j (cloud) or DGraph (self-hosted) | Native graph queries, relationship traversal |
| **Vector Database** | Pinecone (cloud) or Qdrant (self-hosted) | Semantic search via embeddings |
| **Document Store** | PostgreSQL + pgvector | Reliable, can handle vectors too |
| **Real-time Sync** | WebSockets (Socket.io) or Partykit | Live updates across devices |
| **Cache** | Redis | Fast queries, session management |
| **File Storage** | S3 or Cloudflare R2 | Scalable, cheap |

### 3.3 AI/ML Stack

| Component | Technology | Reasoning |
|-----------|-----------|-----------|
| **LLM (Cloud)** | OpenAI GPT-4 or Anthropic Claude API | Best conversational AI, entity extraction |
| **LLM (Local)** | Ollama (Llama 3, Mistral) | Privacy, offline capability |
| **Embeddings** | OpenAI text-embedding-3 or local models | Semantic similarity |
| **NLP** | spaCy or Transformers.js | Entity extraction, NER |
| **Voice-to-Text** | OpenAI Whisper or Web Speech API | Accurate transcription |

### 3.4 DevOps & Infrastructure

| Component | Technology | Reasoning |
|-----------|-----------|-----------|
| **Monorepo** | Turborepo or Nx | Fast builds, shared dependencies |
| **Package Manager** | pnpm | Fast, efficient, monorepo-friendly |
| **CI/CD** | GitHub Actions | Free for public repos, easy setup |
| **Hosting (Web)** | Vercel or Cloudflare Pages | Optimized for Next.js, edge functions |
| **Hosting (API)** | Railway, Fly.io, or AWS | Scalable, Docker support |
| **Desktop Distribution** | Electron Forge + GitHub Releases | Auto-updates, cross-platform builds |
| **Mobile Distribution** | Expo EAS | Simplified build and deployment |

---

## 4. Code Sharing Strategy

### 4.1 Shared Business Logic (`packages/core`)

**What to Share:**
```typescript
// packages/core/src/ai/entity-extractor.ts
export class EntityExtractor {
  extractEntities(text: string): Promise<Entity[]> {
    // Works on web, desktop, mobile
  }
}

// packages/core/src/graph/knowledge-graph.ts
export class KnowledgeGraph {
  addNote(content: string): Promise<Note>
  queryGraph(query: string): Promise<Node[]>
  findRelated(nodeId: string): Promise<Node[]>
}

// packages/core/src/search/semantic-search.ts
export class SemanticSearch {
  search(query: string): Promise<SearchResult[]>
}
```

**Platform Adapters:**
```typescript
// Different storage backends per platform
interface StorageAdapter {
  save(key: string, value: any): Promise<void>
  load(key: string): Promise<any>
}

// Web: IndexedDB
export class WebStorageAdapter implements StorageAdapter { }

// Desktop: SQLite
export class DesktopStorageAdapter implements StorageAdapter { }

// Mobile: AsyncStorage + SQLite
export class MobileStorageAdapter implements StorageAdapter { }
```

### 4.2 Shared UI Components (`packages/ui`)

**Cross-Platform Components:**
```typescript
// packages/ui/src/components/NoteInput.tsx
// Works on web and desktop (both use React DOM)
export const NoteInput: React.FC<Props> = ({ onSubmit }) => {
  return (
    <div className="note-input">
      <textarea placeholder="Brain dump here..." />
      <button onClick={onSubmit}>Capture</button>
    </div>
  )
}
```

**Mobile Equivalent:**
```typescript
// apps/mobile/src/components/NoteInput.tsx
// Uses React Native components
import { TextInput, TouchableOpacity, View } from 'react-native'

export const NoteInput: React.FC<Props> = ({ onSubmit }) => {
  return (
    <View style={styles.container}>
      <TextInput placeholder="Brain dump here..." />
      <TouchableOpacity onPress={onSubmit}>
        <Text>Capture</Text>
      </TouchableOpacity>
    </View>
  )
}
```

**Shared Hooks:**
```typescript
// packages/ui/src/hooks/useNotes.ts
// Works everywhere - platform-agnostic
export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([])

  const addNote = async (content: string) => {
    const note = await api.createNote(content)
    setNotes(prev => [...prev, note])
  }

  return { notes, addNote }
}
```

---

## 5. Data Architecture

### 5.1 Hybrid Data Model

**Local-First with Cloud Sync:**

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Any Platform)                 │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   SQLite     │  │   IndexedDB  │  │  AsyncStorage│  │
│  │  (Desktop)   │  │    (Web)     │  │   (Mobile)   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │          │
│         └─────────────────┼─────────────────┘          │
│                           │                            │
│                    ┌──────▼────────┐                   │
│                    │  Sync Engine  │                   │
│                    │   (CRDTs)     │                   │
│                    └──────┬────────┘                   │
└────────────────────────────┼──────────────────────────┘
                             │
                             │ WebSocket / HTTP
                             │
┌────────────────────────────▼──────────────────────────┐
│                    CLOUD BACKEND                       │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ PostgreSQL   │  │   Neo4j      │  │  Pinecone   │ │
│  │ (Documents)  │  │   (Graph)    │  │  (Vectors)  │ │
│  └──────────────┘  └──────────────┘  └─────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │         AI Processing Workers                     │ │
│  │  • Entity Extraction  • Link Generation          │ │
│  │  • Semantic Search    • Proactive Notifications  │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### 5.2 Graph Schema

**Nodes:**
```typescript
type Note = {
  id: string
  content: string
  createdAt: Date
  embedding: number[] // 1536-dim vector
  metadata: {
    platform: 'web' | 'desktop' | 'mobile'
    location?: GeoPoint
    context?: string
  }
}

type Entity = {
  id: string
  type: 'person' | 'project' | 'place' | 'concept' | 'task'
  name: string
  properties: Record<string, any>
}

type Concept = {
  id: string
  topic: string
  confidence: number
}
```

**Edges:**
```typescript
type Relationship = {
  from: string
  to: string
  type: 'mentions' | 'references' | 'relatedTo' | 'partOf' | 'before' | 'after'
  weight: number // Similarity score
  createdBy: 'user' | 'ai'
}
```

### 5.3 Offline-First Sync Strategy

**Conflict-Free Replicated Data Types (CRDTs):**

```typescript
// Using Yjs or Automerge for offline sync
import * as Y from 'yjs'

const ydoc = new Y.Doc()
const notes = ydoc.getArray('notes')

// Local changes sync automatically when online
notes.push([{ content: 'New thought', timestamp: Date.now() }])

// Syncs via WebSocket provider
import { WebsocketProvider } from 'y-websocket'
const provider = new WebsocketProvider(
  'wss://api.secondbrain.app',
  'user-doc-id',
  ydoc
)
```

---

## 6. AI Processing Pipeline

### 6.1 Processing Flow

```
User Input
    │
    ▼
┌─────────────────────────┐
│  1. RAW TEXT CAPTURE    │
│  "Remind me to call     │
│   John tomorrow at 2pm" │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────────────────────────┐
│  2. NLP PROCESSING (Client or Server)       │
│  • Tokenization                             │
│  • Named Entity Recognition (NER)           │
│  • Intent Classification                    │
│  • Temporal Expression Extraction           │
└───────────┬─────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────┐
│  3. ENTITY EXTRACTION                       │
│  Entities Found:                            │
│  • Person: "John"                           │
│  • Task: "call"                             │
│  • Time: "tomorrow at 2pm"                  │
│  • Intent: "reminder"                       │
└───────────┬─────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────┐
│  4. EMBEDDING GENERATION                    │
│  • Text → Vector (1536 dimensions)          │
│  • Store in vector database                 │
└───────────┬─────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────┐
│  5. GRAPH CONSTRUCTION                      │
│  Create Nodes:                              │
│  • Note node                                │
│  • Person node: "John"                      │
│  • Task node: "Call John"                   │
│  Create Edges:                              │
│  • Note → mentions → John                   │
│  • Note → creates → Task                    │
└───────────┬─────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────┐
│  6. SEMANTIC LINKING                        │
│  • Find similar notes (cosine similarity)   │
│  • Link to related entities                 │
│  • Connect to relevant projects             │
└───────────┬─────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────┐
│  7. PROACTIVE ACTION DETECTION              │
│  • Detected: Reminder needed                │
│  • Schedule: Tomorrow 2pm                   │
│  • Create notification job                  │
└─────────────────────────────────────────────┘
```

### 6.2 Client vs Server Processing

**Client-Side (Fast, Privacy-First):**
- Basic NER using lightweight models (Transformers.js)
- Text embeddings with small models
- Real-time UI updates
- Offline capability

**Server-Side (Powerful, Feature-Rich):**
- Advanced entity extraction (GPT-4/Claude)
- Complex graph queries
- Semantic search across all notes
- Proactive notification scheduling
- Pattern recognition

**Hybrid Approach (Recommended):**
```typescript
// packages/core/src/ai/processor.ts
export class AIProcessor {
  async processNote(content: string, mode: 'client' | 'server' = 'client') {
    // Quick client-side processing
    const basicEntities = await this.clientNER(content)

    // Immediate UI update
    this.emit('entities:quick', basicEntities)

    // Enhanced server-side processing in background
    if (mode === 'server' && navigator.onLine) {
      const enhancedEntities = await this.serverNER(content)
      this.emit('entities:enhanced', enhancedEntities)
    }
  }
}
```

---

## 7. Platform-Specific Features

### 7.1 Web App Features

**Core Features:**
- Full conversational interface
- Rich text editing
- Graph visualization (D3.js or Cytoscape.js)
- Dynamic views and snapshots
- Web Speech API for voice input

**PWA Features:**
```typescript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
})

module.exports = withPWA({
  // ... Next.js config
})
```

**Service Worker for Offline:**
```typescript
// app/sw.ts
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    })
  )
})
```

### 7.2 Desktop App Features (Electron)

**Additional Features:**
- Global keyboard shortcuts (Cmd/Ctrl+Shift+N for quick capture)
- System tray icon with quick capture
- Local AI model (Ollama integration)
- Menu bar app mode
- Auto-start on system boot
- Full offline mode with local database

**Main Process (electron/main.js):**
```javascript
const { app, BrowserWindow, globalShortcut, Tray } = require('electron')

// Global shortcut for quick capture
globalShortcut.register('CommandOrControl+Shift+N', () => {
  showQuickCaptureWindow()
})

// System tray
const tray = new Tray('icon.png')
tray.on('click', () => {
  mainWindow.show()
})
```

**Local AI Integration:**
```typescript
// electron/services/local-ai.ts
import { Ollama } from 'ollama'

export class LocalAI {
  private ollama = new Ollama()

  async extract(text: string) {
    const response = await this.ollama.generate({
      model: 'llama3',
      prompt: `Extract entities from: ${text}`,
    })
    return response
  }
}
```

### 7.3 Mobile App Features (React Native)

**Additional Features:**
- Voice recording widget
- Home screen quick capture widget (iOS/Android)
- Location-based reminders
- Push notifications
- Camera integration for image notes
- Share extension (capture from other apps)
- Offline-first with AsyncStorage + SQLite

**Quick Capture Widget (iOS):**
```swift
// ios/QuickCaptureWidget/QuickCaptureWidget.swift
import WidgetKit
import SwiftUI

@main
struct QuickCaptureWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "QuickCapture", provider: Provider()) { entry in
      QuickCaptureWidgetView(entry: entry)
    }
  }
}
```

**Push Notifications:**
```typescript
// apps/mobile/src/services/notifications.ts
import notifee from '@notifee/react-native'

export async function scheduleProactiveNotification(
  title: string,
  body: string,
  trigger: Date
) {
  await notifee.createTriggerNotification(
    {
      title,
      body,
      android: { channelId: 'proactive' },
      ios: { sound: 'default' },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: trigger.getTime(),
    }
  )
}
```

---

## 8. Development Workflow

### 8.1 Local Development Setup

```bash
# Install dependencies
pnpm install

# Start all apps in dev mode
pnpm dev

# Start specific app
pnpm --filter web dev
pnpm --filter desktop dev
pnpm --filter mobile dev

# Run tests
pnpm test

# Build all packages
pnpm build

# Type checking across monorepo
pnpm typecheck
```

### 8.2 Build & Deploy Pipeline

**Web (Next.js → Vercel):**
```yaml
# .github/workflows/deploy-web.yml
name: Deploy Web
on:
  push:
    branches: [main]
    paths:
      - 'apps/web/**'
      - 'packages/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm --filter web build
      - uses: amondnet/vercel-action@v25
```

**Desktop (Electron):**
```yaml
# .github/workflows/build-desktop.yml
name: Build Desktop
on:
  release:
    types: [created]

jobs:
  build:
    strategy:
      matrix:
        os: [macos-latest, ubuntu-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v3
      - run: pnpm --filter desktop build
      - run: pnpm --filter desktop package
      - uses: actions/upload-artifact@v3
```

**Mobile (React Native):**
```yaml
# .github/workflows/build-mobile.yml
name: Build Mobile
on:
  push:
    branches: [release]

jobs:
  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: expo/expo-github-action@v8
      - run: eas build --platform ios

  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: expo/expo-github-action@v8
      - run: eas build --platform android
```

---

## 9. Security & Privacy

### 9.1 Data Encryption

**At Rest:**
```typescript
// packages/database/src/encryption.ts
import { createCipheriv, createDecipheriv } from 'crypto'

export class EncryptionService {
  private algorithm = 'aes-256-gcm'

  encrypt(data: string, key: Buffer): string {
    const iv = crypto.randomBytes(16)
    const cipher = createCipheriv(this.algorithm, key, iv)
    const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()])
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`
  }

  decrypt(encrypted: string, key: Buffer): string {
    const [ivHex, dataHex] = encrypted.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = createDecipheriv(this.algorithm, key, iv)
    return decipher.update(Buffer.from(dataHex, 'hex')) + decipher.final('utf8')
  }
}
```

**In Transit:**
- All API calls over HTTPS
- WebSocket connections over WSS
- Certificate pinning in mobile apps

### 9.2 Local-First Privacy Mode

**Desktop-Only Mode:**
```typescript
// packages/core/src/config.ts
export const config = {
  mode: process.env.PRIVACY_MODE === 'local' ? 'local' : 'cloud',

  storage: {
    local: {
      path: app.getPath('userData') + '/local-db',
      ai: 'ollama', // Local Llama model
    },
    cloud: {
      apiUrl: 'https://api.secondbrain.app',
      ai: 'openai', // Cloud GPT-4
    }
  }
}
```

---

## 10. Performance Optimization

### 10.1 Code Splitting

**Next.js:**
```typescript
// apps/web/src/app/graph/page.tsx
import dynamic from 'next/dynamic'

// Lazy load heavy graph visualization
const GraphView = dynamic(() => import('@/components/GraphView'), {
  ssr: false,
  loading: () => <Spinner />
})
```

### 10.2 Caching Strategy

```typescript
// packages/api-client/src/hooks/useNotes.ts
import { useQuery } from '@tanstack/react-query'

export const useNotes = () => {
  return useQuery({
    queryKey: ['notes'],
    queryFn: api.getNotes,
    staleTime: 5 * 60 * 1000, // 5 min cache
    gcTime: 10 * 60 * 1000,
  })
}
```

### 10.3 Database Indexing

```sql
-- PostgreSQL indexes for fast queries
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_notes_embedding ON notes USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_entities_type ON entities(type);
```

---

## 11. Testing Strategy

### 11.1 Test Pyramid

```
                    ▲
                   / \
                  /   \
                 /  E2E \          10% - Playwright/Detox
                /       \
               /---------\
              /           \
             / Integration \      30% - API + DB tests
            /               \
           /-----------------\
          /                   \
         /       Unit          \   60% - Jest + Vitest
        /                       \
       /_________________________\
```

### 11.2 Shared Test Utilities

```typescript
// packages/core/__tests__/entity-extractor.test.ts
import { EntityExtractor } from '../src/ai/entity-extractor'

describe('EntityExtractor', () => {
  it('should extract person entity', async () => {
    const extractor = new EntityExtractor()
    const entities = await extractor.extract('Call John tomorrow')

    expect(entities).toContainEqual({
      type: 'person',
      name: 'John'
    })
  })
})
```

---

## 12. Next Steps

### Immediate Actions (Week 1)

1. **Set up monorepo structure**
   - Initialize Turborepo with pnpm
   - Create package structure
   - Configure TypeScript shared configs

2. **Prototype core features**
   - Simple note capture UI (web)
   - Basic entity extraction (mock)
   - Local storage (IndexedDB)

3. **Evaluate AI options**
   - Test OpenAI API for entity extraction
   - Try local model (Ollama + Llama3)
   - Compare speed/accuracy trade-offs

### Short-Term (Weeks 2-4)

1. **Build web MVP**
   - Next.js app with note capture
   - Conversational query interface
   - Basic graph visualization

2. **Backend setup**
   - FastAPI or Node.js server
   - PostgreSQL + pgvector
   - Basic API endpoints

3. **AI integration**
   - Entity extraction pipeline
   - Embedding generation
   - Semantic search

### Medium-Term (Months 2-3)

1. **Desktop app**
   - Electron wrapper
   - Platform-specific features
   - Local AI integration

2. **Mobile app**
   - React Native setup
   - Mobile UI components
   - Push notifications

---

**End of Architecture Document**

*This architecture provides a scalable foundation for building across web, desktop, and mobile while maximizing code reuse and maintaining platform-specific optimizations.*
