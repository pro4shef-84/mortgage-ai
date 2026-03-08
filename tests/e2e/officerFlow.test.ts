import { test, expect } from '@playwright/test'

test.describe('Officer Flow', () => {
  test('landing page loads with CTA', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Stop chasing documents')).toBeVisible()
    await expect(page.getByText('Start Free Trial')).toBeVisible()
  })

  test('unauthenticated access to dashboard redirects to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByText('Officer Sign In')).toBeVisible()
    await expect(page.getByLabel('Email Address')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByText('Sign In')).toBeVisible()
  })
})
