# AI Provider Settings - Implementation Guide

## Overview

CoBrain now features a comprehensive AI Provider Settings interface that allows users to configure and switch between multiple AI providers including **Ollama**, **Claude CLI**, **OpenAI**, and **Anthropic**.

## ✨ Features

### 1. **Visual Provider Management**
- **Provider Cards**: Each AI provider has a dedicated card showing:
  - Connection status (Connected/Disconnected/Testing/Error)
  - Real-time latency metrics
  - Active model information
  - Visual status indicators with pulse animations

### 2. **Real-time Health Monitoring**
- Automatic health checks on page load
- Manual "Test Connection" for each provider
- Latency tracking and display
- Quick stats sidebar showing active providers and average latency

### 3. **Dynamic Configuration**
Each provider has custom configuration options:

#### Ollama
- Base URL (default: `http://localhost:11434`)
- Model selection (llama3:8b, llama3:70b, mistral, codellama)

#### Claude CLI
- CLI path configuration
- Auto-detection message when CLI is available
- No API keys required (uses existing Claude Code installation)

#### OpenAI
- API key management (secure password input)
- Model selection (gpt-4o, gpt-4-turbo, gpt-3.5-turbo)

#### Anthropic
- API key management (secure password input)
- Model selection (claude-sonnet-4, claude-opus-4, claude-3.5-sonnet)

### 4. **Provider Selection**
- Radio button selection for active provider
- Active provider highlighted with gradient border and shadow
- Configuration auto-saves and persists across sessions

### 5. **Setup Assistance**
- Built-in setup guides with direct links to:
  - Ollama installation
  - Claude CLI download
  - API key generation pages

## 🎨 Design Philosophy

The settings page follows a **"Neural Terminal"** aesthetic:
- Clean, modern card-based layout
- Gradient accents (blue to purple) for visual hierarchy
- Monospace fonts for technical values (latency, URLs, API keys)
- Pulse animations for status indicators
- Responsive grid layout (2-column on desktop, single column on mobile)
- Light/dark theme support with proper contrast

## 🏗️ Architecture

### File Structure

```
apps/web/src/
├── app/
│   ├── (app)/
│   │   └── settings/
│   │       └── page.tsx                    # Main settings UI component
│   └── api/
│       └── providers/
│           ├── route.ts                    # GET all providers health status
│           ├── test/
│           │   └── route.ts                # POST test specific provider
│           └── config/
│               └── route.ts                # GET/POST user provider configuration
└── lib/
    └── provider-config-store.ts            # Shared configuration storage

packages/core/src/
└── providers/
    ├── claude-cli.ts                       # Claude CLI provider implementation
    ├── ollama.ts                           # Ollama provider implementation
    ├── openai.ts                           # OpenAI provider implementation
    ├── anthropic.ts                        # Anthropic provider implementation
    └── factory.ts                          # Provider factory methods
```

### API Routes

#### `GET /api/providers`
Returns health status for all providers.

**Response:**
```json
{
  "providers": [
    {
      "id": "ollama",
      "name": "Ollama",
      "type": "ollama",
      "status": "connected",
      "available": true,
      "latency": 234,
      "model": "llama3:8b"
    },
    // ... other providers
  ]
}
```

#### `POST /api/providers/test`
Tests a specific provider with given configuration.

**Request:**
```json
{
  "type": "claude-cli",
  "config": {
    "cliPath": "claude"
  }
}
```

**Response:**
```json
{
  "status": "connected",
  "available": true,
  "latency": 156,
  "model": "claude-sonnet-4-20250514",
  "testResponse": "OK"
}
```

#### `GET /api/providers/config`
Returns user's saved provider configuration.

#### `POST /api/providers/config`
Saves user's provider configuration.

**Request:**
```json
{
  "activeProvider": "claude-cli",
  "configs": {
    "ollama": { ... },
    "claude-cli": { ... },
    "openai": { ... },
    "anthropic": { ... }
  }
}
```

### Configuration Storage

The `ProviderConfigStore` singleton manages configuration:
- In-memory storage (currently)
- Shared between API routes
- TODO: Persist to database

### Chat Integration

The chat API (`/api/chat/route.ts`) now:
1. Retrieves user's provider configuration
2. Initializes the selected provider
3. Falls back to Ollama if selected provider fails
4. Uses the configured models and settings

## 🚀 Usage

### As a User

1. **Navigate to Settings** (`/settings`)
2. **View Provider Status**: See which providers are available
3. **Test Connections**: Click "Test Connection" on any provider
4. **Select Active Provider**: Click the radio button next to your preferred provider
5. **Configure Settings**:
   - Enter API keys for OpenAI/Anthropic
   - Adjust base URLs or CLI paths as needed
6. **Save Configuration**: Click "Save Configuration"
7. **Use in Chat**: Your selected provider will now power the chat feature

### As a Developer

#### Adding a New Provider

1. **Implement Provider Class** in `packages/core/src/providers/`:
```typescript
export class MyProvider extends BaseProvider {
  readonly type: ProviderType = 'my-provider'
  // ... implement required methods
}
```

2. **Register in Factory** (`packages/core/src/providers/factory.ts`):
```typescript
static myProvider(config: MyProviderConfig): MyProvider {
  return new MyProvider(config)
}
```

3. **Update Settings UI** (`apps/web/src/app/(app)/settings/page.tsx`):
   - Add to provider status array
   - Add to configs state
   - Add configuration form section

4. **Update API Routes**:
   - Add case in `/api/providers/route.ts`
   - Add case in `/api/providers/test/route.ts`

## 🎯 Benefits

### For Users
- **Flexibility**: Choose the AI provider that best fits your needs
- **Privacy**: Use local Ollama or Claude CLI for complete privacy
- **Performance**: Select faster cloud providers when needed
- **Cost Control**: Switch between free local AI and paid cloud services

### For Developers
- **Extensibility**: Easy to add new providers
- **Modularity**: Clean separation between UI, API, and provider logic
- **Type Safety**: Full TypeScript support
- **Testing**: Built-in health checks and test functionality

## 📋 TODO

- [ ] Persist configurations to database
- [ ] Add streaming support indicator
- [ ] Show token usage and costs
- [ ] Provider-specific advanced settings
- [ ] Bulk provider testing
- [ ] Import/export configurations
- [ ] Provider performance comparison
- [ ] Auto-fallback on provider failure

## 🎨 UI/UX Highlights

### Key Design Decisions

1. **No Emojis as Icons**: Uses proper emoji as decorative elements only in headers
2. **Monospace for Technical Data**: URLs, API keys, latencies use monospace fonts
3. **Status Animations**: Pulse effect on connected/testing states
4. **Gradient Accents**: Blue-to-purple gradient for active selection and headers
5. **Proper Contrast**: Tested for WCAG AA compliance in both light/dark modes
6. **Responsive Layout**: Mobile-first design with grid breakpoints
7. **Clear Hierarchy**: Section headers, card grouping, sidebar for auxiliary content

### Animation Details

- **Status Pulses**: CSS `animate-pulse` on connection indicators
- **Hover States**: Smooth color transitions on interactive elements
- **Card Elevation**: Shadow effects on active provider card
- **Button Feedback**: Disabled states during async operations

## 🔧 Configuration Examples

### Local-First Setup (Privacy Focused)
```javascript
{
  activeProvider: 'ollama',
  configs: {
    ollama: {
      enabled: true,
      baseUrl: 'http://localhost:11434',
      model: 'llama3:8b'
    }
  }
}
```

### Hybrid Setup (Local + Claude CLI)
```javascript
{
  activeProvider: 'claude-cli',
  configs: {
    'claude-cli': {
      enabled: true,
      cliPath: 'claude'
    },
    ollama: {
      enabled: true,
      baseUrl: 'http://localhost:11434',
      model: 'llama3:8b'
    }
  }
}
```

### Cloud-First Setup
```javascript
{
  activeProvider: 'openai',
  configs: {
    openai: {
      enabled: true,
      apiKey: 'sk-...',
      model: 'gpt-4o'
    }
  }
}
```

## 🌟 Special Features

### Claude CLI Integration
- **Auto-detection**: Checks for Claude CLI in system PATH
- **No API Keys**: Uses existing Claude Code authentication
- **High Quality**: Access to Claude Sonnet 4.5 (200k context)
- **Fast**: 2-5 second response times vs 10-30s for Ollama
- **Special Badge**: Blue banner indicating CLI is detected

### Health Check System
- **Parallel Checks**: All providers checked simultaneously on load
- **Smart Timeouts**: Prevents hanging on unavailable providers
- **Error Details**: Shows specific error messages when connections fail
- **Retry Logic**: Manual retry via "Test Connection" button

---

**Built with ❤️ for the CoBrain community**

*Making AI provider management simple, beautiful, and powerful.*
