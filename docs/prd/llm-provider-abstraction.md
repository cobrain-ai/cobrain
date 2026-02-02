# PRD: LLM Provider Abstraction Layer

**Author**: Product Design Agent
**Date**: 2026-02-02
**Status**: Draft
**Version**: 1.0.0

---

## Executive Summary

Create a unified LLM provider abstraction layer (`@cobrain/core`) that enables CoBrain to seamlessly switch between multiple AI providers without changing application code. This abstraction supports:

- **Claude Code CLI** - Local Claude via subprocess (free for users with Claude Code installed)
- **Ollama** - Local open-source LLMs (Llama 3, Mistral, etc.)
- **Remote APIs** - OpenAI, Anthropic API (premium tier)

This is a foundational feature that will power all AI capabilities in CoBrain, including entity extraction, conversational search, and knowledge graph building.

---

## Problem Statement

CoBrain users need flexible AI options, but current approaches have significant limitations:

### User Pain Points

1. **Vendor lock-in**: Users are forced to use a single AI provider
2. **Cost concerns**: Cloud APIs are expensive for frequent use
3. **Privacy requirements**: Some users cannot send data to external servers
4. **Performance variability**: Different providers excel at different tasks
5. **Availability issues**: Single provider dependency creates single point of failure

### Developer Pain Points

1. **Fragmented APIs**: Each LLM provider has different request/response formats
2. **Inconsistent streaming**: Streaming implementations vary widely
3. **Error handling complexity**: Each provider has unique error codes
4. **Testing difficulty**: Hard to mock/test without abstraction
5. **Migration overhead**: Switching providers requires significant code changes

---

## Goals & Objectives

### Primary Goals

1. **Provider Agnosticism**: Application code works identically regardless of provider
2. **Zero-Config Local AI**: Ollama and Claude CLI work out of the box
3. **Seamless Switching**: Change providers via configuration, not code
4. **Type Safety**: Full TypeScript support with strict types

### Secondary Goals

1. **Streaming First**: All providers support unified streaming interface
2. **Fallback Support**: Automatic fallback when primary provider fails
3. **Usage Tracking**: Monitor token usage and costs across providers
4. **Health Monitoring**: Detect provider availability before use

### Success Metrics (KPIs)

| Metric | Target |
|--------|--------|
| Provider switch time | < 1 line of code change |
| Streaming latency overhead | < 10ms vs direct API |
| Test coverage | > 90% |
| TypeScript strict mode | 100% compliant |
| Zero runtime dependencies | Core types only |

---

## User Stories

### As a CoBrain User...

**US-1: Local AI Usage**
- As a privacy-conscious user
- I want to use Ollama for all AI processing
- So that my data never leaves my device

**Acceptance Criteria**:
- [ ] Ollama auto-detected when running on localhost:11434
- [ ] Works offline after initial model download
- [ ] Clear error message if Ollama not installed
- [ ] Fallback to other providers is optional, not automatic

**US-2: Claude Code CLI Usage**
- As a developer with Claude Code installed
- I want CoBrain to use my existing Claude subscription
- So that I don't pay twice for AI capabilities

**Acceptance Criteria**:
- [ ] Claude CLI detected if installed globally
- [ ] Uses existing Claude Code authentication
- [ ] Streaming responses displayed in real-time
- [ ] Respects Claude Code rate limits

**US-3: Premium Cloud AI**
- As a premium subscriber
- I want faster AI responses via cloud APIs
- So that I get sub-2-second response times

**Acceptance Criteria**:
- [ ] OpenAI and Anthropic APIs supported
- [ ] API keys stored securely (encrypted at rest)
- [ ] Usage tracked against subscription limits
- [ ] Graceful degradation if quota exceeded

**US-4: Provider Selection**
- As a user
- I want to choose which AI provider to use
- So that I can balance speed, cost, and privacy

**Acceptance Criteria**:
- [ ] Settings UI shows available providers
- [ ] Health status displayed (online/offline)
- [ ] One-click provider switching
- [ ] Default provider remembered

### As a CoBrain Developer...

**US-5: Unified API**
- As a developer working on CoBrain features
- I want a single API for all LLM operations
- So that I don't need to handle provider-specific code

**Acceptance Criteria**:
- [ ] Single `complete()` method works for all providers
- [ ] Single `stream()` method works for all providers
- [ ] Consistent error types across providers
- [ ] TypeScript autocomplete for all options

**US-6: Testing**
- As a developer writing tests
- I want to easily mock the LLM provider
- So that tests are fast and deterministic

**Acceptance Criteria**:
- [ ] MockProvider implementation included
- [ ] Predictable responses for test scenarios
- [ ] No network calls in unit tests
- [ ] Coverage reports include provider code

---

## Feature Specifications

### Core Features

#### 1. Provider Interface (`ILLMProvider`)

**Description**: Abstract interface that all providers implement
**Priority**: P0 - Critical
**Complexity**: Medium

```typescript
interface ILLMProvider {
  readonly id: string
  readonly type: ProviderType
  readonly isInitialized: boolean
  readonly capabilities: ProviderCapabilities

  initialize(): Promise<void>
  complete(messages: LLMMessage[], options?: CompletionOptions): Promise<LLMResponse>
  stream(messages: LLMMessage[], options?: CompletionOptions): AsyncGenerator<LLMStreamChunk, LLMResponse>
  healthCheck(): Promise<HealthCheckResult>
  dispose(): Promise<void>
}
```

#### 2. Ollama Provider

**Description**: Local LLM via Ollama HTTP API
**Priority**: P0 - Critical
**Complexity**: Medium

- Connects to `http://localhost:11434` by default
- Supports streaming via Server-Sent Events
- Auto-detects available models
- Graceful handling when Ollama not running

#### 3. Claude CLI Provider

**Description**: Local Claude via subprocess
**Priority**: P0 - Critical
**Complexity**: High

- Spawns `claude` CLI as subprocess
- Uses `--print --output-format stream-json` for streaming
- Respects existing Claude Code authentication
- Handles subprocess lifecycle (start, monitor, terminate)

#### 4. OpenAI Provider

**Description**: OpenAI API integration
**Priority**: P1 - High
**Complexity**: Medium

- Supports GPT-4o, GPT-4o-mini, o1 models
- Streaming via Server-Sent Events
- Function calling support (for future tool use)
- Token usage tracking

#### 5. Anthropic Provider

**Description**: Anthropic API integration
**Priority**: P1 - High
**Complexity**: Medium

- Supports Claude 3.5 Sonnet, Claude 3 Opus
- Streaming via Server-Sent Events
- Extended thinking support (Claude 3.5+)
- Token usage tracking

#### 6. Provider Registry

**Description**: Central registry for managing providers
**Priority**: P0 - Critical
**Complexity**: Medium

- Register multiple providers
- Set default provider
- Get provider by ID or type
- List all available providers
- Provider lifecycle management

#### 7. Provider Factory

**Description**: Create providers from configuration
**Priority**: P1 - High
**Complexity**: Low

- Create provider instances from config objects
- Validate configuration at creation time
- Convenience methods for common setups

### Optional Features (Future)

- **Caching Layer**: Cache responses for identical prompts
- **Cost Calculator**: Estimate costs before API calls
- **Load Balancing**: Distribute requests across multiple providers
- **Prompt Templates**: Reusable prompt patterns
- **Conversation History**: Built-in message history management

---

## Technical Requirements

### Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-1 | System shall provide unified interface for all LLM providers |
| FR-2 | System shall support streaming responses via AsyncGenerator |
| FR-3 | System shall detect Ollama availability on localhost:11434 |
| FR-4 | System shall detect Claude CLI installation via `which claude` |
| FR-5 | System shall validate API keys before making requests |
| FR-6 | System shall track token usage per request |
| FR-7 | System shall provide health check for each provider |
| FR-8 | System shall support request cancellation via AbortSignal |
| FR-9 | System shall normalize errors to consistent error types |
| FR-10 | System shall support multiple concurrent provider instances |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | Streaming latency overhead | < 10ms |
| NFR-2 | Memory footprint (core types) | < 50KB |
| NFR-3 | Bundle size (minified + gzip) | < 20KB |
| NFR-4 | TypeScript strict mode | 100% compliant |
| NFR-5 | Test coverage | > 90% |
| NFR-6 | Zero runtime dependencies | Core types only |
| NFR-7 | Node.js compatibility | 18+ |
| NFR-8 | Browser compatibility | Modern browsers (ES2022) |

### Security Requirements

| ID | Requirement |
|----|-------------|
| SR-1 | API keys must not be logged or exposed in errors |
| SR-2 | API keys should be stored encrypted at rest |
| SR-3 | Subprocess execution must validate command paths |
| SR-4 | HTTP requests must use HTTPS for remote APIs |
| SR-5 | Rate limiting must be respected to prevent API bans |

---

## Dependencies

### Runtime Dependencies

| Package | Purpose | Required |
|---------|---------|----------|
| None | Core abstraction has zero dependencies | - |

### Peer Dependencies

| Package | Purpose | Required |
|---------|---------|----------|
| `react` | React hooks (optional) | Optional |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| `typescript` | Type checking |
| `tsup` | Build tool |
| `vitest` | Testing framework |
| `@vitest/coverage-v8` | Code coverage |

### External Services

| Service | Purpose | Required |
|---------|---------|----------|
| Ollama | Local LLM inference | Optional |
| Claude Code CLI | Local Claude access | Optional |
| OpenAI API | Cloud AI (premium) | Optional |
| Anthropic API | Cloud AI (premium) | Optional |

---

## Out of Scope

The following are explicitly **NOT** included in this PRD:

1. **RAG/Vector Search** - Handled by separate package
2. **Agent/Tool Framework** - Future enhancement
3. **Prompt Engineering** - Application-level concern
4. **Fine-tuning** - Not supported by target providers
5. **Image Generation** - Different API patterns
6. **Speech-to-Text** - Different API patterns
7. **Embeddings** - Separate provider interface (future)
8. **Model Training** - Out of scope for CoBrain

---

## Competitive Analysis

| Feature | CoBrain | Vercel AI SDK | LangChain | LiteLLM |
|---------|---------|---------------|-----------|---------|
| TypeScript-first | Yes | Yes | Partial | No (Python) |
| Claude CLI Support | Yes | No | No | No |
| Ollama Support | Yes | Yes | Yes | Yes |
| Zero Dependencies | Yes | No | No | No |
| Bundle Size | < 20KB | 34KB | 101KB | N/A |
| Edge Runtime | Yes | Yes | No | No |
| React Hooks | Yes | Yes | Partial | No |
| Streaming | Yes | Yes | Yes | Yes |
| Health Checks | Yes | No | No | Yes |
| Free Local AI | Yes | Partial | Partial | Partial |

### Key Differentiators

1. **Claude CLI Support**: Only CoBrain supports using existing Claude Code subscriptions
2. **Zero Dependencies**: Smallest footprint, no supply chain risk
3. **Local-First**: Designed for privacy-conscious users
4. **CoBrain Integration**: Purpose-built for CoBrain's knowledge management use case

---

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Claude CLI API changes | Medium | High | Version detection, graceful degradation |
| Ollama breaking changes | Low | Medium | Pin supported versions, integration tests |
| OpenAI rate limits | Medium | Medium | Exponential backoff, queue requests |
| Anthropic API changes | Low | Medium | Version headers, API versioning |
| Subprocess security | Low | Critical | Command validation, sandboxing |
| Bundle size creep | Medium | Low | Size budget in CI, tree shaking |

---

## Implementation Phases

### Phase 1: Core Types & Base Infrastructure
- Package setup (package.json, tsconfig.json)
- Type definitions (provider, message, response, error)
- Abstract BaseProvider class
- Error classes

### Phase 2: Provider Implementations
- OllamaProvider
- ClaudeCliProvider
- OpenAIProvider
- AnthropicProvider

### Phase 3: Registry & Factory
- ProviderRegistry
- ProviderFactory
- Global registry singleton

### Phase 4: Integration & Hooks
- React hooks (useProvider, useCompletion)
- Barrel exports
- Documentation

### Phase 5: Testing & Polish
- Unit tests for all providers
- Integration tests
- Performance benchmarks
- Documentation

---

## GitHub Issues (Proposed)

1. **[INFRA] Set up @cobrain/core package** - package.json, tsconfig, tsup build
2. **[TYPES] Define LLM provider type system** - All TypeScript interfaces
3. **[CORE] Implement BaseProvider abstract class** - Common functionality
4. **[PROVIDER] Implement OllamaProvider** - Local LLM via HTTP API
5. **[PROVIDER] Implement ClaudeCliProvider** - Claude Code CLI subprocess
6. **[PROVIDER] Implement OpenAIProvider** - OpenAI API integration
7. **[PROVIDER] Implement AnthropicProvider** - Anthropic API integration
8. **[CORE] Implement ProviderRegistry** - Central provider management
9. **[CORE] Implement ProviderFactory** - Config-based creation
10. **[REACT] Add React hooks** - useProvider, useCompletion
11. **[TEST] Add comprehensive test suite** - Unit + integration tests

---

## Appendix

### Research References

- [Vercel AI SDK 6](https://vercel.com/blog/ai-sdk-6) - Agent abstraction patterns
- [LangChain vs Vercel AI SDK](https://strapi.io/blog/langchain-vs-vercel-ai-sdk-vs-openai-sdk-comparison-guide) - Framework comparison
- [Ollama JavaScript Library](https://github.com/ollama/ollama-js) - Official Ollama SDK
- [Claude Code Headless Mode](https://code.claude.com/docs/en/headless) - Programmatic Claude access
- [AnyLLM Project](https://github.com/fkesheh/any-llm) - TypeScript abstraction inspiration

### API Response Format

```typescript
interface LLMResponse {
  id: string
  provider: ProviderType
  model: string
  content: ContentBlock[]
  usage: TokenUsage
  finishReason: FinishReason
  latencyMs: number
  timestamp: Date
}

interface LLMStreamChunk {
  id: string
  index: number
  delta?: {
    text?: string
    toolCall?: ToolCallDelta
  }
  finishReason?: FinishReason
}
```

### Provider Configuration Examples

```typescript
// Ollama (local)
const ollama = await ProviderFactory.ollama({
  baseUrl: 'http://localhost:11434',
  defaultModel: 'llama3:8b',
})

// Claude CLI (local)
const claudeCli = await ProviderFactory.claudeCli({
  cliPath: 'claude', // or full path
  defaultModel: 'claude-sonnet-4-20250514',
})

// OpenAI (remote)
const openai = await ProviderFactory.openai({
  apiKey: process.env.OPENAI_API_KEY,
  defaultModel: 'gpt-4o',
})

// Anthropic (remote)
const anthropic = await ProviderFactory.anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultModel: 'claude-3-5-sonnet-20241022',
})
```
