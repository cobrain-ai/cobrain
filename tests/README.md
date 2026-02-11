# CoBrain Test Suite

This directory contains end-to-end (E2E) tests using Playwright.

## Test Structure

```
tests/
├── e2e/                        # Playwright E2E tests
│   ├── onboarding.spec.ts      # Landing page and onboarding flow tests
│   └── settings-providers.spec.ts  # AI provider settings tests
└── README.md                   # This file
```

## Running Tests

### Prerequisites

1. Install dependencies:
```bash
pnpm install
```

2. Install Playwright browsers (first time only):
```bash
npx playwright install
```

### Run E2E Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run tests in headed mode (see browser)
pnpm test:e2e --headed

# Run specific test file
pnpm test:e2e tests/e2e/onboarding.spec.ts

# Run tests in debug mode
pnpm test:e2e --debug

# Run tests with UI mode
pnpm test:e2e --ui
```

### Run Unit Tests

```bash
# Run all unit tests
pnpm test

# Run unit tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage

# Run tests in specific package
pnpm --filter @cobrain/core test
pnpm --filter @cobrain/web test
```

## Test Coverage

### E2E Tests (Playwright)

- **onboarding.spec.ts**: Tests for the landing page and onboarding flow
  - Landing page content display
  - "Get Started" button navigation
  - Onboarding step progression
  - Development mode auth bypass
  - Cross-page navigation

- **settings-providers.spec.ts**: Tests for AI provider configuration
  - Provider settings display
  - Test connection functionality
  - Claude CLI configuration
  - Settings page accessibility without login

### Unit Tests

- **packages/core/src/providers/claude-cli.test.ts**: Claude CLI provider tests
  - JSON response parsing (new format with `type`, `result`, `modelUsage`)
  - CLI argument validation (no `--max-tokens` flag)
  - Mock process testing
  - Error handling
  - Abort signal support

- **apps/web/src/lib/auth.test.ts**: Authentication bypass tests
  - Mock session in development mode
  - Production mode behavior
  - Session structure validation
  - Middleware wrapper functionality

## CI/CD Integration

The E2E tests are configured to run in CI with:
- Automatic retries on failure (2 retries)
- Sequential execution for stability
- HTML reporter for test results

## Writing New Tests

### E2E Tests

Create new test files in `tests/e2e/`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Something')).toBeVisible()
  })
})
```

### Unit Tests

Create test files next to the source files with `.test.ts` extension:

```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from './myFunction.js'

describe('myFunction', () => {
  it('should work correctly', () => {
    expect(myFunction()).toBe(expected)
  })
})
```

## Debugging Tests

### Playwright Inspector

```bash
pnpm test:e2e --debug
```

This opens the Playwright Inspector which allows you to:
- Step through tests
- View locators
- Inspect DOM
- See network requests

### Trace Viewer

Tests are configured to capture traces on first retry. View them with:

```bash
npx playwright show-trace trace.zip
```

### VS Code Integration

Install the [Playwright VS Code extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) for:
- Running tests from editor
- Debugging with breakpoints
- Viewing test results inline

## Best Practices

1. **Use semantic locators**: Prefer `getByRole`, `getByText`, `getByLabel` over CSS selectors
2. **Wait for conditions**: Use `expect` assertions which auto-wait
3. **Test user flows**: Focus on complete user journeys, not implementation details
4. **Mock external dependencies**: Use mock providers for AI/API calls in unit tests
5. **Keep tests independent**: Each test should be able to run in isolation
6. **Clean up**: Use `beforeEach`/`afterEach` hooks for setup/teardown

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Vitest Documentation](https://vitest.dev)
- [Testing Library Best Practices](https://testing-library.com/docs/queries/about)
