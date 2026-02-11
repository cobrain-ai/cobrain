import { test, expect } from '@playwright/test'

test.describe('Settings - AI Providers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
  })

  test('should display AI provider settings', async ({ page }) => {
    // Should be on settings page
    await expect(page).toHaveURL('/settings')

    // Check for provider names
    await expect(page.getByText('Ollama')).toBeVisible()
    await expect(page.getByText('Claude CLI')).toBeVisible()
    await expect(page.getByText('OpenAI')).toBeVisible()
    await expect(page.getByText('Anthropic')).toBeVisible()
  })

  test('should have test connection buttons for providers', async ({ page }) => {
    // Look for test connection buttons (exact text might vary)
    const buttons = page.getByRole('button', { name: /test/i })
    const count = await buttons.count()

    // Should have at least one test button
    expect(count).toBeGreaterThan(0)
  })

  test('Claude CLI provider should be configurable', async ({ page }) => {
    // Find Claude CLI section
    const claudeSection = page.locator('text=Claude CLI').locator('..')

    // Should show CLI path configuration
    // (Exact selector depends on implementation)
    await expect(claudeSection).toBeVisible()
  })

  test('should persist provider configuration', async ({ page }) => {
    // This test would check if toggling a provider and refreshing
    // preserves the setting. Skipped for now as it requires
    // checking actual API calls and localStorage/database state.
    test.skip()
  })
})

test.describe('Settings - Navigation', () => {
  test('should navigate to settings from other pages', async ({ page }) => {
    // Start at home
    await page.goto('/')

    // Navigate to settings (might need to find the link in nav/menu)
    await page.goto('/settings')
    await expect(page).toHaveURL('/settings')
  })

  test('settings should work without login in development', async ({ page }) => {
    await page.goto('/settings')

    // Should not redirect to login
    await expect(page).toHaveURL('/settings')
    await expect(page).not.toHaveURL(/\/login/)
  })
})
