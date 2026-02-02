# Contributing to CoBrain

Thank you for your interest in contributing to CoBrain! 🧠

We're building CoBrain in public and welcome contributions from everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Community](#community)

---

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- **Be respectful** - Treat everyone with respect
- **Be collaborative** - Work together, help each other
- **Be inclusive** - Welcome newcomers
- **Be constructive** - Provide helpful feedback

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Ollama (for local AI features)
- Git

### Fork and Clone

\`\`\`bash
# Fork the repo on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/cobrain.git
cd cobrain

# Add upstream remote
git remote add upstream https://github.com/cobrain-ai/cobrain.git
\`\`\`

### Install Dependencies

\`\`\`bash
pnpm install
\`\`\`

### Start Development

\`\`\`bash
# Start all apps in dev mode
pnpm dev

# Or start specific app
pnpm --filter web dev
\`\`\`

## Development Workflow

### 1. Create a Branch

\`\`\`bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
\`\`\`

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

### 2. Make Your Changes

- Write clean, readable code
- Follow our coding standards (below)
- Add tests if applicable
- Update documentation

### 3. Test Your Changes

\`\`\`bash
# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format
\`\`\`

### 4. Commit Your Changes

Use conventional commit messages:

\`\`\`
feat: add voice input support
fix: resolve entity extraction bug
docs: update installation guide
refactor: simplify search algorithm
test: add tests for graph queries
\`\`\`

Types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### 5. Push and Create PR

\`\`\`bash
git push origin feature/your-feature-name
\`\`\`

Then create a Pull Request on GitHub.

## Pull Request Process

1. **Update documentation** if you changed APIs or added features
2. **Add tests** for new functionality
3. **Ensure CI passes** - All tests and lints must pass
4. **Fill out PR template** - Describe what and why
5. **Request review** - Tag relevant maintainers
6. **Address feedback** - Respond to review comments

### PR Title Format

Use conventional commit format:
```
feat: add graph visualization
fix: resolve memory leak in AI processor
docs: add contribution guidelines
```

### What Makes a Good PR?

✅ **Do:**
- Keep PRs focused and small
- Write clear commit messages
- Add tests for new features
- Update documentation
- Respond to feedback promptly

❌ **Don't:**
- Submit huge PRs with many changes
- Mix unrelated changes
- Skip tests or documentation
- Force push after review starts

## Coding Standards

### TypeScript

\`\`\`typescript
// Use TypeScript for all code
// Prefer interfaces over types for objects
interface Note {
  id: string
  content: string
  createdAt: Date
}

// Use meaningful variable names
const extractedEntities = extractEntities(noteContent)

// Add JSDoc comments for public APIs
/**
 * Extracts entities from note content
 * @param content - The note content to analyze
 * @returns Array of extracted entities
 */
export function extractEntities(content: string): Entity[] {
  // ...
}
\`\`\`

### React Components

\`\`\`tsx
// Use functional components with TypeScript
interface NoteInputProps {
  onSubmit: (content: string) => void
  placeholder?: string
}

export function NoteInput({ onSubmit, placeholder }: NoteInputProps) {
  // Component logic
}

// Use descriptive prop names
// Extract complex logic to custom hooks
// Keep components focused and small
\`\`\`

### File Structure

\`\`\`
packages/core/
├── src/
│   ├── ai/           # AI-related code
│   ├── graph/        # Graph database
│   ├── search/       # Search engine
│   └── types/        # TypeScript types
├── tests/            # Tests
└── package.json
\`\`\`

### Code Style

- Use Prettier for formatting (automatic)
- Use ESLint for linting
- 100 character line limit
- 2 spaces for indentation
- Single quotes for strings
- No semicolons

## Finding Issues to Work On

### Good First Issues

New to CoBrain? Look for issues labeled [`good first issue`](https://github.com/cobrain-ai/cobrain/labels/good%20first%20issue).

### Help Wanted

Issues labeled [`help wanted`](https://github.com/cobrain-ai/cobrain/labels/help%20wanted) are great for contributors.

### Feature Requests

Check [Discussions](https://github.com/cobrain-ai/cobrain/discussions) for feature ideas.

## Community

- **Discord:** [Join our community](https://discord.gg/cobrain)
- **Twitter:** [@cobrain_ai](https://twitter.com/cobrain_ai)
- **Discussions:** [GitHub Discussions](https://github.com/cobrain-ai/cobrain/discussions)

## Questions?

- Ask in [Discussions](https://github.com/cobrain-ai/cobrain/discussions)
- Join our [Discord](https://discord.gg/cobrain)
- Tag maintainers in issues

---

**Thank you for contributing to CoBrain!** 🙏

Together, we're building the future of knowledge management. 🚀
