# CoBrain 🧠

> Your AI thinking partner. Open-source second brain with local AI.

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 🎯 What is CoBrain?

CoBrain is an AI-powered second brain that **eliminates manual organization**. Just capture your thoughts, and CoBrain's AI automatically organizes, links, and surfaces information when you need it.

**Think of it as:** GitHub Copilot for your thoughts.

### ✨ Key Features

- 🆓 **Free forever** with local AI (no subscriptions required)
- 🔒 **Privacy-first** - Your data stays on your device
- 🧠 **Zero structure** - No folders, no tags, just think
- 💬 **Conversational** - Ask questions naturally
- 🔗 **Auto-linking** - AI builds your knowledge graph
- ⚡ **Fast** - Local AI processes everything offline
- 📱 **Multi-platform** - Web, Desktop (Tauri), Mobile (React Native)
- 🔄 **Sync** - Multi-device synchronization with cr-sqlite

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Ollama (for local AI)

### Installation

```bash
# Clone the repository
git clone https://github.com/cobrain-ai/cobrain.git
cd cobrain

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see CoBrain in action.

### Setting Up Local AI

1. **Install Ollama:** [ollama.com](https://ollama.com)
2. **Pull required models:**
   ```bash
   ollama pull llama3:8b
   ollama pull nomic-embed-text
   ```
3. **That's it!** CoBrain will auto-detect Ollama and start using local AI.

---

## 🖥️ Platform-Specific Setup

### Web App
```bash
cd apps/web
pnpm dev          # Development server at http://localhost:3000
pnpm build        # Production build
pnpm test         # Run tests
```

### Desktop App (Tauri)
```bash
cd apps/desktop
pnpm dev          # Development with hot reload
pnpm build        # Build for distribution
```
**Prerequisites:** [Rust](https://rustup.rs/) and Tauri CLI

### Mobile App (Expo/React Native)
```bash
cd apps/mobile
pnpm start        # Start Expo dev server
pnpm android      # Run on Android emulator
pnpm ios          # Run on iOS simulator (macOS only)
pnpm web          # Run in browser
```
**Prerequisites:** Expo CLI, Android Studio or Xcode

### Sync Server
```bash
cd packages/sync-server
pnpm build        # Build the server
pnpm start        # Run WebSocket sync server
pnpm dev          # Development with watch mode
```

---

## 📖 How It Works

### 1. Capture Anything
Just type your thoughts. No categorization needed.

```
"Remind me to call John tomorrow at 2pm about the project proposal"
```

### 2. AI Auto-Organization
CoBrain's AI automatically:
- Extracts entities (John, project, tomorrow 2pm)
- Creates relationships
- Builds your knowledge graph

### 3. Ask Questions
Use natural language to retrieve information:

```
"What did I say about the project?"
"When should I call John?"
"Show all notes from last week"
```

### 4. Image OCR
Upload images and extract text automatically:
- Screenshots, whiteboard photos, handwritten notes
- Privacy-first: processed locally with Tesseract.js
- Extracted text is searchable and linked to your knowledge graph

---

## 🏗️ Architecture

CoBrain is built as a monorepo with:

```
cobrain/
├── apps/
│   ├── web/          # Next.js 15 web application
│   ├── desktop/      # Tauri desktop app (Windows, macOS, Linux)
│   └── mobile/       # Expo React Native app (iOS, Android)
├── packages/
│   ├── core/         # Core types and utilities
│   ├── database/     # Drizzle ORM + SQLite + cr-sqlite CRDT
│   ├── ai/           # AI processing, entity extraction, embeddings
│   ├── ocr/          # Image OCR with Tesseract.js
│   ├── calendar/     # Calendar integration (Google, Outlook)
│   ├── sync/         # CRDT sync engine
│   ├── sync-server/  # WebSocket sync server
│   └── ui/           # Shared React components
└── docs/
    └── prd/          # Product requirement documents
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS |
| **Mobile** | Expo SDK 52, React Native, NativeWind |
| **Desktop** | Tauri 2.0, Rust |
| **AI** | Ollama (Llama 3), OpenAI (optional), Tesseract.js |
| **Database** | SQLite, Drizzle ORM, cr-sqlite (CRDT) |
| **Sync** | WebSocket, cr-sqlite changesets |
| **Build** | Turborepo, pnpm workspaces |

---

## 🗺️ Roadmap

### ✅ Completed
- [x] Project setup & monorepo structure
- [x] Basic note capture UI
- [x] Local AI integration (Ollama)
- [x] Entity extraction & knowledge graph
- [x] Conversational search
- [x] Graph visualization (React Flow)
- [x] Multi-device sync architecture (cr-sqlite)
- [x] Mobile app foundation (Expo)
- [x] Desktop app foundation (Tauri)
- [x] Calendar integration (Google, Outlook)
- [x] View sharing with password protection
- [x] Image OCR text extraction

### 🚧 In Progress
- [ ] Voice input & transcription
- [ ] Proactive notifications
- [ ] Browser extension

### 📋 Planned
- [ ] Team collaboration
- [ ] Plugin system
- [ ] API for integrations

[View all issues →](https://github.com/cobrain-ai/cobrain/issues)

---

## 🤝 Contributing

We welcome contributions! CoBrain is built in public.

### Ways to Contribute

- 🐛 **Report bugs** - [Open an issue](https://github.com/cobrain-ai/cobrain/issues/new)
- 💡 **Request features** - [Start a discussion](https://github.com/cobrain-ai/cobrain/discussions)
- 🔧 **Submit PRs** - Check [good first issues](https://github.com/cobrain-ai/cobrain/labels/good%20first%20issue)
- 📖 **Improve docs** - Documentation PRs always welcome
- ⭐ **Star the repo** - Helps others discover CoBrain

### Development

```bash
# Install dependencies
pnpm install

# Start dev server (all apps)
pnpm dev

# Start specific app
pnpm --filter web dev
pnpm --filter desktop dev
pnpm --filter mobile start

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📄 License

CoBrain is open-source under the [AGPL-3.0 License](LICENSE).

### What You Can Do
- ✅ Use, modify, and distribute the software freely
- ✅ Run it for personal or business use
- ✅ Self-host everything including sync server
- ✅ Contribute improvements back to the community

**Note:** If you modify CoBrain and offer it as a network service, you must release your source code under AGPL-3.0.

---

## 🌟 Why CoBrain?

### The Problem

Existing note-taking apps require you to:
- Organize notes into folders/tags manually
- Remember where you saved things
- Actively search for information
- Choose between cloud (convenient) or local (private)

### The CoBrain Solution

- ✅ **Zero organization** - AI does it automatically
- ✅ **Natural retrieval** - Just ask questions
- ✅ **Proactive reminders** - Information surfaces when needed
- ✅ **Free + Private** - Local AI, no cloud required
- ✅ **Open-source** - Transparent, auditable, extendable
- ✅ **Multi-platform** - Web, desktop, and mobile

---

## 💬 Community

- **GitHub Discussions:** [Join the conversation](https://github.com/cobrain-ai/cobrain/discussions)
- **Issues:** [Report bugs or request features](https://github.com/cobrain-ai/cobrain/issues)

---

## 🙏 Acknowledgments

CoBrain is inspired by:
- Building a Second Brain (Tiago Forte)
- Obsidian's local-first philosophy
- Notion's ease of use

Special thanks to all [contributors](https://github.com/cobrain-ai/cobrain/graphs/contributors)!

---

**Built with ❤️ by the CoBrain community**

*Like GitHub Copilot for your code, CoBrain is a co-pilot for your thoughts.*

[⭐ Star us on GitHub](https://github.com/cobrain-ai/cobrain)
