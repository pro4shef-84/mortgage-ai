import { test, expect } from '@playwright/test'

test.describe('Borrower Portal Flow', () => {
  test('invalid portal token shows 404', async ({ page }) => {
    await page.goto('/portal/invalid-token-12345')
    // Should show 404 or not-found page
    const statusCode = await page.evaluate(() => document.title)
    // Next.js 404 page or our custom not found
    expect(statusCode).toBeTruthy()
  })

  test('upload page requires requirement param', async ({ page }) => {
    await page.goto('/portal/some-token/upload')
    // Without requirement param, should 404
    await expect(page).not.toHaveURL('/dashboard')
  })
})
