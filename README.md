# CoBrain 🧠

> Your AI thinking partner. Open-source second brain with local AI.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
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

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Ollama (for local AI)

### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/cobrain-ai/cobrain.git
cd cobrain

# Install dependencies
pnpm install

# Start development server
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see CoBrain in action.

### Setting Up Local AI

1. **Install Ollama:** [ollama.com](https://ollama.com)
2. **Pull required models:**
   \`\`\`bash
   ollama pull llama3:8b
   ollama pull nomic-embed-text
   \`\`\`
3. **That's it!** CoBrain will auto-detect Ollama and start using local AI.

---

## 📖 How It Works

### 1. Capture Anything
Just type your thoughts. No categorization needed.

\`\`\`
"Remind me to call John tomorrow at 2pm about the project proposal"
\`\`\`

### 2. AI Auto-Organization
CoBrain's AI automatically:
- Extracts entities (John, project, tomorrow 2pm)
- Creates relationships
- Builds your knowledge graph

### 3. Ask Questions
Use natural language to retrieve information:

\`\`\`
"What did I say about the project?"
"When should I call John?"
"Show all notes from last week"
\`\`\`

### 4. Get Proactive Reminders (Pro)
CoBrain reminds you at the right time:
- "Time to call John (2pm today)"
- "Meeting in 10 min - here's what you discussed last time"

---

## 🏗️ Architecture

CoBrain is built as a monorepo with:

- **apps/web** - Next.js web application
- **apps/desktop** - Electron wrapper (coming soon)
- **apps/mobile** - React Native apps (coming soon)
- **packages/core** - AI, graph, search logic
- **packages/ui** - Shared React components
- **packages/database** - Local storage & graph database
- **packages/api-client** - Premium cloud API client

### Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **AI:** Ollama, Llama 3, OpenAI (premium)
- **Data:** SQLite, Graph database, Vector search
- **Build:** Turborepo, pnpm

---

## 🆓 Free vs Pro

| Feature | Free (Local AI) | Pro (Cloud AI) |
|---------|-----------------|----------------|
| **Notes** | Unlimited | Unlimited |
| **AI Processing** | Local (Llama 3) | Cloud (GPT-4/Claude) |
| **Speed** | 10-30 seconds | < 2 seconds |
| **Offline** | ✅ Full | ⚠️ Requires internet |
| **Privacy** | ✅ 100% local | 🔐 Encrypted |
| **Devices** | Desktop/Web | + Mobile apps |
| **Sync** | ❌ Local only | ✅ Cloud sync |
| **Proactive Notifications** | ❌ | ✅ |
| **Price** | **Free** | **$10-12/month** |

---

## 🗺️ Roadmap

### Month 1-3: MVP (Current)
- [x] Project setup
- [ ] Basic note capture UI
- [ ] Local AI integration (Ollama)
- [ ] Entity extraction
- [ ] Conversational search
- [ ] Graph visualization

### Month 4-6: Desktop & Premium
- [ ] Electron desktop app
- [ ] Cloud AI integration
- [ ] Premium tier launch
- [ ] Cloud sync

### Month 7-12: Mobile & Growth
- [ ] React Native mobile apps
- [ ] Proactive notifications
- [ ] Student tier
- [ ] Team features

[View full roadmap →](https://github.com/cobrain-ai/cobrain/projects/1)

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

\`\`\`bash
# Install dependencies
pnpm install

# Start dev server (all apps)
pnpm dev

# Start specific app
pnpm --filter web dev

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format
\`\`\`

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📄 License

CoBrain is open-source software licensed under the [MIT License](LICENSE).

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

---

## 💬 Community

- **Twitter:** [@cobrain_ai](https://twitter.com/cobrain_ai)
- **Discord:** [Join our community](https://discord.gg/cobrain)
- **Discussions:** [GitHub Discussions](https://github.com/cobrain-ai/cobrain/discussions)

---

## 🙏 Acknowledgments

CoBrain is inspired by:
- Building a Second Brain (Tiago Forte)
- Mem AI's proactive notifications
- Obsidian's local-first philosophy
- Notion's ease of use

Special thanks to all [contributors](https://github.com/cobrain-ai/cobrain/graphs/contributors)!

---

**Built with ❤️ by the CoBrain community**

*Like GitHub Copilot for your code, CoBrain is a co-pilot for your thoughts.*

[⭐ Star us on GitHub](https://github.com/cobrain-ai/cobrain) • [📖 Read the docs](https://docs.cobrain.ai) • [🚀 Try CoBrain](https://cobrain.ai)
