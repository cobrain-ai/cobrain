# Product Requirements Document (PRD)
# CoBrain - AI-Powered Intelligent Note-Taking System

**Document Version:** 1.1
**Last Updated:** 2026-02-02
**Status:** Draft
**Author:** Product Team

---

## 1. Executive Summary

### 1.1 Product Vision
CoBrain is a next-generation AI-powered note-taking application that transcends traditional Personal Knowledge Management (PKM) systems. Unlike conventional note-taking apps that require users to manually organize information into static pages and folders, CoBrain functions as a true cognitive extension—automatically organizing information, proactively surfacing relevant knowledge, and engaging users through natural language interactions.

### 1.2 Problem Statement
Current note-taking applications suffer from fundamental limitations:
- **Organizational Burden:** Users spend significant time organizing notes into folders, tags, and hierarchies
- **Information Retrieval Friction:** Finding specific information requires remembering exact locations or keywords
- **Passive Systems:** Notes remain dormant until manually accessed by users
- **Structural Rigidity:** Fixed page structures don't mirror how human memory actually works
- **Context Switching:** Users must actively remember to check their notes at the right moments

### 1.3 Solution Overview
CoBrain eliminates these pain points by:
- **Zero-Organization Input:** Users simply input thoughts, tasks, and information without any structural consideration
- **AI-Powered Auto-Organization:** Internal graph-based data structures automatically organize and connect information
- **Conversational Interface:** Natural language queries replace manual searching
- **Proactive Intelligence:** The system actively notifies users with relevant information at the right time
- **Dynamic Views:** On-demand generation of both real-time updated views and static snapshots

---

## 2. Market Analysis

### 2.1 Competitive Landscape (2026)

#### **Tier 1: Established Platforms**

**Notion**
- **Strengths:** All-in-one workspace, databases, team collaboration, AI integration
- **Weaknesses:** Complex setup required, not optimized for rapid capture, structure-first approach
- **Market Position:** Enterprise and team-focused productivity hub

**Obsidian**
- **Strengths:** Local-first, powerful linking, plugin ecosystem, Markdown-based
- **Weaknesses:** Steep learning curve, manual organization required, limited built-in AI
- **Market Position:** Power users and knowledge workers seeking privacy and flexibility

**Logseq**
- **Strengths:** Outliner-based, open-source (AGPL), privacy-focused, bidirectional links
- **Weaknesses:** Manual structuring required, limited AI capabilities
- **Market Position:** Privacy-conscious users and open-source advocates

#### **Tier 2: AI-First Innovators**

**Mem AI**
- **Strengths:**
  - Conversational interface with agentic chat
  - "Heads Up" proactive notifications before meetings
  - Voice mode for brain dumps
  - Deep semantic search
  - Offline support
- **Weaknesses:** Primarily focused on professional knowledge work
- **Market Position:** AI thought partner for professionals
- **Key Differentiator:** Strongest proactive notification system in market

**Capacities**
- **Strengths:** Object-based note-taking, visual organization, AI helper integration
- **Weaknesses:** Still requires some structural thinking from users
- **Market Position:** Visual thinkers and structured note-takers

**Reflect Notes**
- **Strengths:** Privacy-focused with GPT integration, voice notes, simplicity
- **Weaknesses:** Less feature-rich than competitors
- **Market Position:** Privacy-conscious professionals

#### **Tier 3: Emerging Alternatives**

**AFFiNE**
- **Hybrid Notion + Miro:** Structured data + infinite canvas
- **Open-source alternative** with multimodal capture

**Tana**
- **Supertag system** for flexible automated workflows
- **No forced structure** approach

**Heptabase**
- **Visual-first** with infinite whiteboards for idea mapping
- **Card-based system** for spatial thinkers

**Radiant**
- **Calendar-integrated** automatic memory layer
- **Meeting-centric** knowledge capture

### 2.2 Market Trends (2026)

According to industry analysis, the 2026 second brain software landscape demands:

1. **Multimodal Capture:** Text, hand-drawing, diagrams, and databases in single view
2. **Advanced AI Intelligence:** Beyond chat—connection, generation, and automated organization
3. **Frictionless Input:** Minimal cognitive load during capture phase
4. **Proactive Systems:** AI that surfaces information before users ask
5. **Privacy Options:** Both local-first and cloud-based solutions

### 2.3 Market Gap & Opportunity

**Current Gap:** While competitors offer pieces of the solution, none fully deliver on the "true second brain" promise:
- Notion/Obsidian/Logseq require manual organization
- Mem AI excels at proactive notifications but still uses traditional note structures
- Visual tools (Heptabase, AFFiNE) require spatial organization effort

**Our Opportunity:** Create the first truly structure-free, AI-native second brain that:
- Requires zero organizational effort
- Learns user context and patterns
- Proactively serves information
- Allows both conversational queries and dynamic view generation

---

## 3. User Personas

### 3.1 Primary Persona: "The Overwhelmed Knowledge Worker"
- **Name:** Sarah Chen
- **Age:** 32
- **Role:** Product Manager at tech startup
- **Pain Points:**
  - Constantly context-switching between meetings, tasks, ideas
  - Loses track of important details mentioned in conversations
  - Spends too much time organizing notes instead of using them
  - Forgets to follow up on commitments
- **Goals:**
  - Capture everything quickly without thinking about structure
  - Retrieve information through natural conversation
  - Get proactive reminders for commitments
  - Focus on work, not note organization

### 3.2 Secondary Persona: "The Creative Connector"
- **Name:** Marcus Rivera
- **Age:** 28
- **Role:** Freelance writer and researcher
- **Pain Points:**
  - Ideas come at random times and need quick capture
  - Struggles to find connections between disparate notes
  - Needs different views of same information for different projects
- **Goals:**
  - Effortless capture from any device
  - AI-discovered connections between ideas
  - Dynamic project views that auto-update

### 3.3 Tertiary Persona: "The Busy Parent"
- **Name:** Jamie Thompson
- **Age:** 41
- **Role:** Marketing director and parent of two
- **Pain Points:**
  - Juggles professional tasks with family responsibilities
  - Forgets grocery items, appointments, kids' events
  - Needs simple system that works without maintenance
- **Goals:**
  - Brain dump everything in one place
  - Ask questions in plain language
  - Get timely reminders for family commitments

---

## 4. Product Requirements

### 4.1 Core Principles

1. **Zero-Structure Input:** No folders, no tags, no organizational decisions required during capture
2. **AI-Native Architecture:** Graph-based data model with AI-powered connections and organization
3. **Conversational First:** Natural language as primary interface for both input and retrieval
4. **Proactive Intelligence:** System initiates interactions, not just responds to queries
5. **View Flexibility:** Generate any view on-demand, both dynamic and static

### 4.2 Feature Requirements

#### **4.2.1 Data Input & Capture (P0 - Must Have)**

| Feature | Description | Acceptance Criteria |
|---------|-------------|---------------------|
| **Freeform Text Input** | Users can type/paste any content without categorization | - Single input field always accessible<br>- No required metadata<br>- Supports rich text and Markdown |
| **Voice Input** | Voice-to-text brain dumps | - Real-time transcription<br>- Works offline (if possible)<br>- Handles conversational language |
| **Quick Capture** | Rapid input from any screen/device | - Mobile quick capture widget<br>- Browser extension<br>- Desktop global shortcut<br>- Sub-2-second activation |
| **Multi-format Support** | Accept various content types | - Text, URLs, images, files<br>- Web clippings<br>- Email forwarding |
| **Batch Import** | Import existing notes from other apps | - Notion, Obsidian, Logseq, Markdown<br>- Preserve basic formatting<br>- Automatic AI processing of imported content |

#### **4.2.2 AI-Powered Organization (P0 - Must Have)**

| Feature | Description | Acceptance Criteria |
|---------|-------------|---------------------|
| **Automatic Entity Extraction** | Identify people, places, dates, projects, topics | - Extracts: names, locations, timestamps, URLs, projects, topics<br>- Creates graph nodes automatically<br>- No user confirmation required |
| **Semantic Linking** | AI creates connections between related information | - Bidirectional links generated automatically<br>- Similarity scoring<br>- Connection reasoning visible to user |
| **Context Understanding** | Learns user patterns and relationships | - Recognizes recurring people, projects, contexts<br>- Adapts to user vocabulary<br>- Improves over time with usage |
| **Dynamic Tagging** | AI generates and applies conceptual tags | - Topic modeling<br>- Hierarchical categorization<br>- User can override/refine |
| **Knowledge Graph** | Internal graph database structure | - Nodes: entities, concepts, notes<br>- Edges: relationships, references<br>- Query-able via graph algorithms |

#### **4.2.3 Conversational Interface (P0 - Must Have)**

| Feature | Description | Acceptance Criteria |
|---------|-------------|---------------------|
| **Natural Language Queries** | Ask questions in everyday language | - "What do I need to do today?"<br>- "What should I buy at the store?"<br>- "When did I last talk to John?"<br>- Response time < 2 seconds |
| **Contextual Understanding** | Follow-up questions maintain context | - Multi-turn conversations<br>- Pronoun resolution<br>- Temporal context awareness |
| **Action Commands** | Create, update, delete via conversation | - "Remind me to call Mom tomorrow"<br>- "Add milk to shopping list"<br>- "Delete all notes about Project X" |
| **Search Results Format** | Conversational + structured results | - Natural language answer<br>- Linked source notes<br>- Confidence indicators |
| **Voice Conversation** | Spoken queries and responses | - Wake word or button activation<br>- Text-to-speech responses<br>- Hands-free operation |

#### **4.2.4 Proactive Notifications (P0 - Must Have)**

| Feature | Description | Acceptance Criteria |
|---------|-------------|---------------------|
| **Time-Based Reminders** | Automatic extraction and alerting | - "Take medication at 9am" → automatic daily reminder<br>- No manual reminder setup needed<br>- Smart scheduling based on context |
| **Context-Triggered Alerts** | Notifications based on situation | - Meeting starting → surface related notes<br>- Location-based (near grocery store → shopping list)<br>- Person-based (calling someone → conversation history) |
| **Commitment Tracking** | Track promises and follow-ups | - Detects commitments in notes ("I'll send that by Friday")<br>- Proactive reminders before deadline<br>- Follow-up suggestions after meetings |
| **Pattern Recognition** | Learn and suggest based on habits | - "You usually review weekly goals on Sunday morning"<br>- "Time for your monthly check-in with mentor"<br>- Adaptive to changing patterns |
| **Smart Timing** | Don't interrupt, choose right moments | - Respects focus/DND mode<br>- Batches non-urgent notifications<br>- Learns user preferences |

#### **4.2.5 Dynamic Views (P1 - Should Have)**

| Feature | Description | Acceptance Criteria |
|---------|-------------|---------------------|
| **Auto-Updating Views** | Real-time filtered collections | - "Show all projects"<br>- "Family information"<br>- "Books to read"<br>- Updates automatically when new info added |
| **Query-Based Views** | Custom filters and sorts | - Graph query language or natural language<br>- Multiple criteria (time, topic, person, etc.)<br>- Saved view definitions |
| **View Templates** | Pre-built view types | - Project list, contact list, task board, timeline<br>- One-click creation<br>- Customizable |
| **Static Snapshots** | Freeze view at point in time | - "Save current state of Project Alpha"<br>- Read-only preserved view<br>- Comparison with current state |
| **Visual Formats** | Multiple rendering options | - List, grid, timeline, graph visualization<br>- Table with sortable columns<br>- Kanban board |
| **View Sharing** | Share specific views | - Generate shareable link<br>- Permission control<br>- Real-time or static |

#### **4.2.6 Memory & Retrieval (P0 - Must Have)**

| Feature | Description | Acceptance Criteria |
|---------|-------------|---------------------|
| **Semantic Search** | Find by meaning, not keywords | - Conceptual matching<br>- Synonym awareness<br>- Multilingual support |
| **Temporal Queries** | Time-based retrieval | - "What was I working on last Tuesday?"<br>- "Notes from last month"<br>- Date range filters |
| **Relationship Navigation** | Explore connected information | - "Everything related to Project X"<br>- Graph visualization<br>- Degree-of-separation traversal |
| **Fuzzy Matching** | Find despite incomplete/incorrect recall | - Approximate string matching<br>- Phonetic similarity<br>- "I talked to someone whose name starts with J..." |
| **Full-Text Search** | Traditional keyword search as fallback | - Instant results<br>- Regex support<br>- Case-insensitive |

### 4.3 Non-Functional Requirements

#### **4.3.1 Performance**
- **Input Latency:** < 100ms from keystroke to display
- **Query Response:** < 2 seconds for conversational queries
- **AI Processing:** Background, non-blocking for user
- **Sync Time:** < 5 seconds across devices
- **Offline Support:** Full functionality without internet (with local AI model option)

#### **4.3.2 Scalability**
- **Data Volume:** Support 100,000+ notes per user
- **Graph Complexity:** Handle 1M+ nodes and edges efficiently
- **Concurrent Users:** Scale to 1M+ users (cloud version)
- **Growth:** Database structure that scales horizontally

#### **4.3.3 Privacy & Security**
- **Encryption:** E2E encryption for cloud storage
- **Local-First Option:** Full local storage with optional sync
- **Data Ownership:** Users can export entire graph in open format
- **AI Privacy:** Option for local AI processing vs. cloud
- **Compliance:** GDPR, CCPA compliant

#### **4.3.4 Usability**
- **Onboarding:** < 5 minutes to first successful capture and query
- **Learning Curve:** Zero training required for basic use
- **Accessibility:** WCAG 2.1 AA compliance
- **Multi-platform:** Consistent UX across web, desktop, mobile

#### **4.3.5 Reliability**
- **Uptime:** 99.9% availability for cloud services
- **Data Integrity:** Zero data loss guarantees
- **Backup:** Automatic daily backups with version history
- **Conflict Resolution:** Smart merging for concurrent edits

---

## 5. User Stories

### 5.1 Epic 1: Effortless Capture

**US-1.1:** As a busy professional, I want to quickly dump thoughts without thinking about organization, so I can capture ideas without breaking my flow.
- **Acceptance:** Single-field input, no required metadata, keyboard shortcut accessible

**US-1.2:** As a user on-the-go, I want to voice-record notes while walking, so I can capture thoughts hands-free.
- **Acceptance:** Voice transcription, background processing, no manual transcription needed

**US-1.3:** As a researcher, I want to clip web articles with one click, so I can save sources without interrupting reading.
- **Acceptance:** Browser extension, preserves formatting, auto-extracts metadata

### 5.2 Epic 2: Conversational Intelligence

**US-2.1:** As a forgetful person, I want to ask "What do I need to do today?" and get a clear answer, so I don't have to remember to check my task list.
- **Acceptance:** Natural language query, contextual results, < 2 sec response

**US-2.2:** As a parent, I want to ask "What do I need from the grocery store?" and see my shopping list, so I don't forget items.
- **Acceptance:** Query understands synonyms (store/market/grocery), aggregates all food-related notes

**US-2.3:** As a manager, I want to ask "What did we discuss in the last meeting with John?" to prep for our next conversation.
- **Acceptance:** Temporal + person query, surfaced relevant notes, shows date context

### 5.3 Epic 3: Proactive Assistance

**US-3.1:** As a medication user, I want the app to automatically remind me to take pills based on notes I've entered, so I don't have to set up manual reminders.
- **Acceptance:** Detects "take medicine at 9am", creates recurring notification, no manual setup

**US-3.2:** As a meeting participant, I want to see relevant background info before meetings, so I can prepare without searching.
- **Acceptance:** Calendar integration, "Heads Up" 10 min before meeting, shows related notes

**US-3.3:** As a committed person, I want to be reminded of promises I've made, so I can follow through.
- **Acceptance:** Detects commitments ("I'll send that document by Friday"), proactive reminder before deadline

### 5.4 Epic 4: Dynamic Knowledge Organization

**US-4.1:** As a project manager, I want a live view of all my active projects without manually maintaining it, so it stays up-to-date automatically.
- **Acceptance:** Auto-updating project list, new projects appear automatically, completed ones archived

**US-4.2:** As a book reader, I want to see all books I've mentioned wanting to read, so I have a reading list without creating one manually.
- **Acceptance:** "Show books to read" query or saved view, updates when new books mentioned

**US-4.3:** As a knowledge worker, I want to create a snapshot of project status for reporting, so I can preserve point-in-time state.
- **Acceptance:** Static view creation, preserved despite future changes, exportable

---

## 6. Technical Considerations

### 6.1 System Architecture (High-Level)

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
│  (Web, Desktop, Mobile, Browser Extension, Voice Interface) │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    Application Layer                         │
│  • Input Processing     • Query Engine                       │
│  • Notification Service • View Generator                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                       AI/ML Layer                            │
│  • Entity Extraction    • Semantic Search                    │
│  • Link Generation      • Context Learning                   │
│  • NLP/LLM Integration  • Pattern Recognition                │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      Data Layer                              │
│  • Graph Database       • Vector Database (embeddings)       │
│  • Document Store       • Cache Layer                        │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Technology Stack (Hybrid Approach - Recommended)

- **Frontend:** Next.js 15 (React 19), React Native (mobile), Electron (desktop)
- **Backend:** Node.js + Fastify or Python + FastAPI
- **Graph DB:** Neo4j (cloud) or SQLite with graph extensions (local)
- **Vector DB:** Pinecone (cloud) or embedded FAISS/Hnswlib (local)
- **LLM:** See Section 13 - LLM Provider Abstraction
- **Sync:** CRDTs for offline-first, WebSockets for real-time
- **Hosting:** Vercel (web), Railway/Fly.io (API)

### 6.3 Data Model

**Graph Structure:**
- **Nodes:** Notes (freeform), Entities (people, projects, places), Concepts (topics)
- **Edges:** References, Mentions, RelatedTo, PartOf, Temporal (before/after)
- **Properties:** Content, embeddings, metadata, confidence scores

### 6.4 Integration Requirements

- **Calendar:** Google Calendar, Outlook, Apple Calendar
- **Email:** Gmail, Outlook (forward to inbox feature)
- **Browser:** Chrome, Firefox, Safari extensions
- **Voice:** OS-level voice APIs (Siri, Google Assistant integration potential)
- **File Storage:** Google Drive, Dropbox for attachments
- **Export:** Markdown, JSON, CSV, PDF

---

## 7. Success Metrics (KPIs)

### 7.1 Engagement Metrics
- **Daily Active Users (DAU):** Target 60% of MAU
- **Notes Per User Per Week:** Target average 20+
- **Queries Per Day:** Target average 5+
- **Session Length:** Average 10+ minutes
- **Retention:** 70% day-7, 40% day-30

### 7.2 Product-Specific Metrics
- **Zero-Click Captures:** % of notes created with no organizational action (target: 95%)
- **Proactive Notification Engagement:** Click-through rate on proactive notifications (target: 40%)
- **Conversational Query Success Rate:** Queries that result in satisfactory answer (target: 85%)
- **Time to Retrieve:** Average time from query to finding info (target: < 30 seconds)
- **View Creation Rate:** % of users creating custom views (target: 50%)

### 7.3 Technical Metrics
- **Query Response Time:** p95 < 2 seconds
- **Sync Latency:** p95 < 5 seconds
- **Crash Rate:** < 0.1% of sessions
- **AI Accuracy:** Entity extraction precision > 90%, linking relevance > 80%

### 7.4 Business Metrics
- **User Acquisition Cost (CAC):** Target < $30
- **Monthly Recurring Revenue (MRR):** Growth target 20% month-over-month
- **Churn Rate:** < 5% monthly
- **Net Promoter Score (NPS):** Target > 50

---

## 8. Go-to-Market Strategy

### 8.1 Launch Phases

**Phase 1: Private Alpha (Months 1-2)**
- Invite-only 100 power users
- Focus: Core capture + conversational interface
- Goal: Validate core concept, collect feedback

**Phase 2: Public Beta (Months 3-4)**
- Open waitlist, gradual rollout to 5,000 users
- Focus: Add proactive notifications + dynamic views
- Goal: Stress test, refine AI accuracy

**Phase 3: V1 Launch (Month 5)**
- Public release with all P0 features
- Marketing campaign targeting knowledge workers
- Goal: Reach 10,000 users, establish product-market fit

**Phase 4: Growth (Months 6-12)**
- Mobile apps, advanced features (P1/P2)
- Team/collaboration features
- Goal: Scale to 100,000+ users

### 8.2 Pricing Model

**Freemium Tier:**
- Up to 1,000 notes
- 50 queries/day
- Cloud AI processing
- Basic views
- **Price:** Free

**Personal Pro Tier:**
- Unlimited notes
- Unlimited queries
- Advanced proactive notifications
- Custom views + snapshots
- Priority support
- **Price:** $10/month or $100/year

**Local Privacy Tier:**
- All Pro features
- Local AI processing (full privacy)
- No cloud dependency
- One-time purchase or subscription
- **Price:** $15/month or $150/year (or $299 lifetime)

**Team Tier (Future):**
- Shared knowledge bases
- Collaboration features
- Admin controls
- **Price:** $20/user/month

### 8.3 Target Channels

- **Product Hunt:** Launch day feature
- **Hacker News:** Technical deep-dive post
- **Reddit:** r/productivity, r/PKMS, r/Notion
- **Twitter/X:** AI and productivity influencers
- **YouTube:** Demos and comparison videos
- **Content Marketing:** SEO-optimized articles on "second brain," "PKM," "AI notes"

---

## 9. Risks & Mitigations

### 9.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| AI accuracy insufficient | High | Medium | Extensive training data, human-in-loop refinement, user feedback loops |
| Performance degradation at scale | High | Medium | Horizontal scaling architecture, caching strategies, query optimization |
| Local AI too slow | Medium | High | Offer cloud option, optimize models, hardware acceleration (Metal/CUDA) |
| Data loss/corruption | Critical | Low | Multi-layer backups, version history, integrity checks |

### 9.2 Market Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Incumbents add similar features | High | High | Focus on superior UX, faster iteration, community building |
| Users don't trust AI organization | Medium | Medium | Transparency tools (show connections), user override options |
| Market too small | High | Low | Expand to adjacent markets (education, teams, enterprises) |
| Privacy concerns with cloud AI | Medium | Medium | Offer local-first option, clear privacy policy, encryption |

### 9.3 Adoption Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Users skeptical of "zero structure" | Medium | High | Excellent onboarding, show value in first session, optional manual organization |
| Migration friction from current tools | Medium | High | Easy import from all major competitors, preserve existing structure if desired |
| Learning curve despite simplicity claim | Medium | Medium | Tutorial videos, interactive walkthrough, AI-guided setup |

---

## 10. Open Questions for Further Exploration

### 10.1 Product Questions
1. **Collaboration:** Should V1 include any team/sharing features, or purely single-user?
2. **Manual Override:** How much manual control should users have over AI organization?
3. **Notification Frequency:** What's the optimal balance between helpful and annoying?
4. **Mobile-First vs. Desktop-First:** Which platform should drive initial design?

### 10.2 Technical Questions
1. **LLM Choice:** Fine-tuned smaller model vs. larger general model via API?
2. **Graph vs. Vector:** Primary index on graph structure or embeddings?
3. **Real-time vs. Batch:** Should AI processing be instant or background?
4. **Cross-Platform Sync:** CRDTs, operational transforms, or last-write-wins?

### 10.3 Business Questions
1. **Freemium Limits:** What constraints drive conversion without frustrating free users?
2. **Enterprise Potential:** Is there early signal for team/enterprise demand?
3. **Partnerships:** Should we integrate deeply with one ecosystem (Apple, Google, Microsoft)?
4. **Open Source:** Any components that should be open-sourced for community trust?

---

## 11. Roadmap & Next Steps

### 11.1 Immediate Actions (Week 1-2)
1. **Technical Spike:** Prototype AI entity extraction + graph linking with sample data
2. **Design Sprint:** Create wireframes for core capture + conversational interface
3. **Market Validation:** Interview 20 target users about pain points and feature priorities
4. **Architecture Decision:** Choose between cloud-first, local-first, or hybrid approach

### 11.2 Short-Term (Month 1)
1. **Build MVP:** Core capture + basic AI organization + simple query interface
2. **Alpha Invite:** Recruit 50 early adopters
3. **Feedback Loop:** Weekly user interviews
4. **Refine PRD:** Update based on prototype learnings

### 11.3 Medium-Term (Months 2-4)
1. **Beta Development:** Add proactive notifications + dynamic views
2. **Platform Expansion:** Desktop + mobile apps
3. **Marketing Prep:** Content creation, landing page, waitlist
4. **Funding:** Seed round or bootstrap decision

---

## 12. Glossary

- **Second Brain:** External system for storing and organizing knowledge to augment human memory
- **PKM:** Personal Knowledge Management - methodologies for capturing and organizing information
- **Graph Database:** Database optimized for storing nodes and relationships
- **Vector Embedding:** Numerical representation of semantic meaning for similarity comparison
- **Entity Extraction:** NLP technique to identify named entities (people, places, organizations)
- **Dynamic View:** Real-time filtered collection that updates automatically
- **Static Snapshot:** Frozen point-in-time view of data
- **Proactive Notification:** System-initiated alert based on context, not user request
- **Semantic Search:** Search by meaning rather than exact keyword matching
- **CRDT:** Conflict-free Replicated Data Type - data structure for offline-first sync

---

## 13. Feature Specification: LLM Provider Abstraction Layer

### 13.1 Overview

CoBrain requires a unified LLM provider abstraction (`@cobrain/core`) that enables seamless switching between multiple AI providers:

- **Claude Code CLI** - Local Claude via subprocess (free for users with Claude Code installed)
- **Ollama** - Local open-source LLMs (Llama 3, Mistral, etc.)
- **Remote APIs** - OpenAI, Anthropic API (premium tier)

This is a foundational feature powering all AI capabilities: entity extraction, conversational search, and knowledge graph building.

### 13.2 Problem Statement

**User Pain Points:**
1. Vendor lock-in to single AI provider
2. Cost concerns with cloud APIs for frequent use
3. Privacy requirements preventing cloud data transmission
4. Single provider dependency creates availability issues

**Developer Pain Points:**
1. Fragmented APIs across providers
2. Inconsistent streaming implementations
3. Provider-specific error handling
4. Testing difficulty without abstraction

### 13.3 Goals

| Goal | Target |
|------|--------|
| Provider switch time | < 1 line of code change |
| Streaming latency overhead | < 10ms vs direct API |
| Test coverage | > 90% |
| TypeScript strict mode | 100% compliant |
| Runtime dependencies | Zero |

### 13.4 Core Interface

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

type ProviderType = 'claude-cli' | 'ollama' | 'openai' | 'anthropic'
```

### 13.5 Provider Specifications

| Provider | Description | Priority | Complexity |
|----------|-------------|----------|------------|
| **Ollama** | Local LLM via HTTP API (localhost:11434) | P0 | Medium |
| **Claude CLI** | Local Claude via subprocess | P0 | High |
| **OpenAI** | Cloud API (GPT-4o, GPT-4o-mini) | P1 | Medium |
| **Anthropic** | Cloud API (Claude 3.5 Sonnet, Opus) | P1 | Medium |

### 13.6 User Stories

**US-LLM-1: Local AI Usage**
- As a privacy-conscious user, I want to use Ollama for all AI processing, so my data never leaves my device.
- **Acceptance:** Ollama auto-detected, works offline, clear error if not installed

**US-LLM-2: Claude Code CLI Usage**
- As a developer with Claude Code installed, I want CoBrain to use my existing subscription.
- **Acceptance:** CLI auto-detected, uses existing auth, streaming responses

**US-LLM-3: Premium Cloud AI**
- As a premium subscriber, I want faster AI responses via cloud APIs.
- **Acceptance:** OpenAI/Anthropic supported, secure key storage, usage tracking

**US-LLM-4: Provider Selection**
- As a user, I want to choose which AI provider to use.
- **Acceptance:** Settings UI shows providers, health status, one-click switching

### 13.7 Technical Requirements

| ID | Requirement |
|----|-------------|
| FR-1 | Unified interface for all LLM providers |
| FR-2 | Streaming responses via AsyncGenerator |
| FR-3 | Detect Ollama on localhost:11434 |
| FR-4 | Detect Claude CLI installation |
| FR-5 | Validate API keys before requests |
| FR-6 | Track token usage per request |
| FR-7 | Health check for each provider |
| FR-8 | Request cancellation via AbortSignal |
| FR-9 | Normalize errors to consistent types |

### 13.8 Security Requirements

| ID | Requirement |
|----|-------------|
| SR-1 | API keys must not be logged or exposed in errors |
| SR-2 | API keys stored encrypted at rest |
| SR-3 | Subprocess execution validates command paths |
| SR-4 | HTTPS for all remote API requests |
| SR-5 | Rate limiting respected to prevent API bans |

### 13.9 Competitive Analysis: LLM SDKs

| Feature | CoBrain | Vercel AI SDK | LangChain | LiteLLM |
|---------|---------|---------------|-----------|---------|
| TypeScript-first | Yes | Yes | Partial | No (Python) |
| **Claude CLI Support** | **Yes** | No | No | No |
| Ollama Support | Yes | Yes | Yes | Yes |
| Zero Dependencies | Yes | No | No | No |
| Bundle Size | < 20KB | 34KB | 101KB | N/A |
| Edge Runtime | Yes | Yes | No | No |
| React Hooks | Yes | Yes | Partial | No |
| Health Checks | Yes | No | No | Yes |

**Key Differentiator:** CoBrain is the only SDK supporting Claude Code CLI for free local Claude access.

### 13.10 Implementation Phases

**Phase 1:** Package setup, type definitions, BaseProvider class, error classes
**Phase 2:** OllamaProvider, ClaudeCliProvider, OpenAIProvider, AnthropicProvider
**Phase 3:** ProviderRegistry, ProviderFactory, global singleton
**Phase 4:** React hooks (useProvider, useCompletion), documentation
**Phase 5:** Unit tests, integration tests, benchmarks

### 13.11 GitHub Issues

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

## 14. Research Sources

### 14.1 Competitive Analysis - PKM Apps
- [Top 10 Obsidian Alternatives 2026](https://buildin.ai/blog/top-10-obsidian-alternatives)
- [5 Best Second Brain Apps 2026 Ranked](https://affine.pro/blog/best-second-brain-apps)
- [Introducing Mem 2.0: The World's First AI Thought Partner](https://get.mem.ai/blog/introducing-mem-2-0)

### 14.2 Second Brain Methodology
- [Building a Second Brain](https://buildingasecondbrain.com/)
- [Building a Second Brain: The Illustrated Notes](https://maggieappleton.com/basb)

### 14.3 LLM SDKs & Abstraction
- [Vercel AI SDK 6](https://vercel.com/blog/ai-sdk-6)
- [LangChain vs Vercel AI SDK Comparison](https://strapi.io/blog/langchain-vs-vercel-ai-sdk-vs-openai-sdk-comparison-guide)
- [Ollama JavaScript Library](https://github.com/ollama/ollama-js)
- [Claude Code Headless Mode](https://code.claude.com/docs/en/headless)

---

## 15. Feature Priority Matrix

| Feature Category | Must Have (P0) | Should Have (P1) | Nice to Have (P2) |
|-----------------|----------------|------------------|-------------------|
| **Capture** | Text input, Voice input, Quick capture | Web clipper, Email forwarding | Image OCR, Handwriting |
| **Organization** | Entity extraction, Auto-linking, Knowledge graph | Tag refinement, Manual overrides | Auto-categorization themes |
| **Retrieval** | Conversational queries, Semantic search | Graph visualization | Advanced query language |
| **Proactive** | Time reminders, Commitment tracking | Context triggers | Habit suggestions |
| **Views** | Basic lists | Dynamic views, Static snapshots | Custom templates, Sharing |
| **Platform** | Web app | Desktop, Mobile | Browser extension, Wearables |
| **AI Providers** | Ollama, Claude CLI | OpenAI, Anthropic | Google, Azure, Custom |

---

**End of Document**

*This PRD is a living document and will be updated based on user research, technical discoveries, and market feedback throughout the development process.*
