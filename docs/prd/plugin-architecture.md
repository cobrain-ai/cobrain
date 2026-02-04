# PRD: Plugin Architecture

**Author**: Product Design Agent
**Date**: 2026-02-04
**Status**: Implemented (Foundation)
**GitHub Issue**: #44

---

## Executive Summary

CoBrain adopts a plugin-based architecture where the core system manages information snippets and their relations, while plugins provide extensible functionality layers. This architecture enables:

- Modular feature development
- User-configurable feature sets
- Third-party plugin development
- Cleaner separation of concerns

---

## Architecture Overview

### Layered Design

```
┌─────────────────────────────────────────────────────────────┐
│                      Plugin Layer                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │Reminders│  │Entities │  │  Views  │  │ Search  │   ...   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      Core Layer                              │
│  • Note (Snippet) Management                                 │
│  • Relation Storage                                          │
│  • User Authentication                                       │
│  • Plugin Registry & Lifecycle                               │
│  • LLM Provider Abstraction                                  │
└─────────────────────────────────────────────────────────────┘
```

### Core Layer Responsibilities

The core layer provides foundational functionality:

1. **Snippet (Note) Management**
   - Create, read, update, delete notes
   - Content storage and versioning
   - Basic metadata (timestamps, source)

2. **Relation Management**
   - Store connections between snippets
   - Bidirectional linking
   - Relation types and weights

3. **Plugin System**
   - Plugin registration and discovery
   - Lifecycle management (load, unload, enable, disable)
   - Configuration management
   - Event system for plugin communication

4. **LLM Abstraction**
   - Provider-agnostic AI operations
   - Streaming support
   - Health checking

---

## Plugin Interface

### Core Plugin Interface

```typescript
interface Plugin {
  // Metadata
  readonly meta: PluginMeta
  readonly configSchema?: PluginConfigSchema[]

  // Extensions
  readonly entityTypes?: PluginEntityType[]
  readonly viewTemplates?: PluginViewTemplate[]
  readonly uiExtensions?: PluginUIExtension[]
  readonly routes?: PluginRoute[]

  // Lifecycle
  initialize(context: PluginContext): Promise<void>
  dispose(): Promise<void>
  getState(): PluginState

  // Processing hooks
  readonly hooks?: NoteProcessingHook
}
```

### Plugin Metadata

```typescript
interface PluginMeta {
  id: string           // Unique identifier
  name: string         // Display name
  description: string  // Short description
  version: string      // Semantic version
  author?: string
  homepage?: string
  icon?: string        // Emoji or URL
}
```

### Plugin Context

Plugins receive a context object with:

```typescript
interface PluginContext {
  userId: string
  provider?: LLMProvider
  config: PluginConfig
  log: (level, message, data?) => void
}
```

---

## Official Plugins

### 1. Reminders Plugin (`@cobrain/plugins/reminders`)

**Purpose**: Extract and manage time-based reminders, commitments, and follow-ups.

**Features**:
- Rule-based reminder extraction
- LLM-powered commitment detection
- Recurring reminder support
- Snooze functionality
- Push notification integration

**Configuration**:
- `enabled`: Enable/disable extraction
- `useLLM`: Use AI for extraction
- `extractCommitments`: Detect "I'll X by Y" patterns
- `defaultReminderTime`: Default time for date-only reminders

### 2. Entities Plugin (`@cobrain/plugins/entities`)

**Purpose**: Extract named entities and build the knowledge graph.

**Features**:
- Entity extraction (people, places, dates, projects, etc.)
- Automatic relation creation
- Entity type configuration
- Graph visualization support

**Configuration**:
- `enabled`: Enable/disable extraction
- `useLLM`: Use AI for extraction
- `extractPeople`, `extractPlaces`, etc.: Per-type toggles
- `autoRelate`: Create co-occurrence relations

### 3. Views Plugin (`@cobrain/plugins/views`)

**Purpose**: Create dynamic views and snapshots of notes.

**Features**:
- Query-based dynamic views
- Multiple layouts (list, grid, kanban, timeline, table)
- View templates
- Point-in-time snapshots
- View sharing (optional)

**Configuration**:
- `enabled`: Enable views feature
- `defaultLayout`: Default view layout
- `enableSharing`: Allow public sharing
- `maxSnapshots`: Limit snapshots per view

### 4. Search Plugin (`@cobrain/plugins/search`)

**Purpose**: Semantic and keyword search across notes.

**Features**:
- Keyword search
- Semantic (embedding-based) search
- Hybrid search combining both
- Configurable thresholds
- Filter by date, tags, entities

**Configuration**:
- `defaultMode`: Default search mode
- `semanticThreshold`: Minimum similarity score
- `keywordBoost`: Boost for combined matches
- `maxResults`: Result limit

---

## Plugin Lifecycle

### States

```
unloaded → loading → active
    ↓         ↓         ↓
disabled   error    disabled
```

### Registration

```typescript
registry.register(manifest, factory)
```

### Loading

```typescript
await registry.load(pluginId, userId)
```

### Configuration

```typescript
registry.setConfig(pluginId, { key: value })
```

### Events

```typescript
registry.subscribe((event) => {
  // plugin:registered, plugin:loaded, plugin:unloaded,
  // plugin:error, plugin:config-changed
})
```

---

## UI Extension Points

Plugins can extend the UI at these locations:

| Location | Description |
|----------|-------------|
| `sidebar` | Navigation sidebar items |
| `settings` | Settings page sections |
| `note-actions` | Actions on note cards |
| `capture-toolbar` | Quick capture toolbar |
| `dashboard-widget` | Dashboard widgets |

---

## Future Plugin Ideas

Potential plugins for user-developed extensions:

1. **Goals Plugin** - Long-term goal tracking
2. **Habits Plugin** - Daily habit tracking
3. **Journal Plugin** - Daily journaling prompts
4. **Calendar Plugin** - Calendar integration
5. **Contacts Plugin** - Extended people management
6. **Finance Plugin** - Expense tracking from notes
7. **Health Plugin** - Health metrics extraction
8. **Reading List Plugin** - Book/article tracking

---

## Package Structure

```
packages/
├── core/
│   └── src/
│       ├── plugins/
│       │   ├── types.ts      # Plugin interfaces
│       │   ├── registry.ts   # Plugin registry
│       │   └── base-plugin.ts # Base class
│       └── index.ts
│
└── plugins/
    └── src/
        ├── reminders/
        │   ├── extractor.ts
        │   ├── plugin.ts
        │   └── index.ts
        ├── entities/
        │   ├── extractor.ts
        │   ├── plugin.ts
        │   └── index.ts
        ├── views/
        │   ├── plugin.ts
        │   └── index.ts
        ├── search/
        │   ├── search.ts
        │   ├── plugin.ts
        │   └── index.ts
        └── index.ts
```

---

## React Integration

### Hooks

```typescript
// Manage all plugins
const { plugins, enablePlugin, disablePlugin, togglePlugin } = usePlugins(userId)

// Access specific plugin
const reminders = usePlugin<RemindersPlugin>('reminders')

// Plugin configuration
const [config, setConfig] = usePluginConfig('reminders')
```

### Initialization

```typescript
// In app initialization
await initializePlugins(userId)
```

---

## Security Considerations

1. **Plugin Isolation**: Plugins operate within defined boundaries
2. **Configuration Validation**: Config values are type-checked
3. **Error Boundaries**: Plugin errors don't crash the app
4. **Permission Model**: Future: per-plugin permissions

---

## Migration Path

Existing features will be gradually migrated to plugins:

1. ✅ Reminders → Reminders Plugin
2. ✅ Entity Extraction → Entities Plugin
3. ✅ Views/Snapshots → Views Plugin
4. ✅ Search → Search Plugin
5. ⏳ Chat/AI → Chat Plugin (future)
6. ⏳ Import → Import Plugin (future)

---

## Success Metrics

- Plugin enable/disable usage
- Plugin configuration changes
- Plugin-related error rates
- Third-party plugin adoption (future)

---

## Implementation Status

| Component | Status |
|-----------|--------|
| Plugin Types | ✅ Complete |
| Plugin Registry | ✅ Complete |
| Base Plugin Class | ✅ Complete |
| Reminders Plugin | ✅ Complete |
| Entities Plugin | ✅ Complete |
| Views Plugin | ✅ Complete |
| Search Plugin | ✅ Complete |
| React Hooks | ✅ Complete |
| Settings UI | ⏳ Pending |
| Plugin Marketplace | 📋 Future |
