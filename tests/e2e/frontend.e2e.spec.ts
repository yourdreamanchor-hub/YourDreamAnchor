import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('home page renders every section', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle(/Your Dream Anchor/)
    await expect(page.locator('h1').first()).toContainText('Every celebration')
    for (const id of ['about', 'services', 'moments', 'gallery', 'contact']) {
      await expect(page.locator(`#${id}`)).toBeAttached()
    }
  })

  test('a reel opens in the lightbox', async ({ page }) => {
    await page.goto('http://localhost:3000/#moments')
    await page.locator('.reel').first().click()
    await expect(page.locator('dialog.lightbox video')).toBeVisible()
  })

  test('privacy page is reachable from the footer', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.locator('footer a[href="/privacy"]').click()
    await expect(page.locator('h1')).toHaveText('Privacy policy')
  })
})
