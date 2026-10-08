import { test, expect } from '@playwright/test'
import { deleteTestInquiries } from '../helpers/cleanup'

test.describe('Frontend', () => {
  test('home page renders every section', async ({ page }) => {
    await page.goto('http://localhost:3100')

    await expect(page).toHaveTitle(/Your Dream Anchor/)
    await expect(page.locator('h1').first()).toContainText('Every celebration')
    for (const id of ['about', 'services', 'moments', 'gallery', 'contact']) {
      await expect(page.locator(`#${id}`)).toBeAttached()
    }
  })

  test('a reel opens in the lightbox', async ({ page }) => {
    await page.goto('http://localhost:3100/#moments')
    await page.locator('.reel').first().click()
    await expect(page.locator('dialog.lightbox video')).toBeVisible()
  })

  test('privacy page is reachable from the footer', async ({ page }) => {
    await page.goto('http://localhost:3100')
    await page.locator('footer a[href="/privacy"]').click()
    await expect(page.locator('h1')).toHaveText('Privacy policy')
  })
})

test.describe('WhatsApp', () => {
  test.afterAll(async () => {
    await deleteTestInquiries('E2E WhatsApp test')
  })

  test('floating button opens a chat with the greeting', async ({ page }) => {
    await page.goto('/')
    const href = await page.locator('a.wa-float').getAttribute('href')
    expect(href).toMatch(/^https:\/\/wa\.me\/\d{11,}\?text=/)
  })

  test('after sending the form, the enquiry can be forwarded on WhatsApp', async ({ page }) => {
    await page.goto('/#contact')
    const form = page.locator('form.form')
    await form.locator('[name=name]').fill('E2E WhatsApp test')
    await form.locator('[name=phone]').fill('+91 90000 22222')
    await form.locator('[name=eventType]').selectOption('sangeet')
    await form.locator('[name=city]').fill('Ahmedabad')
    await form.locator('button[type=submit], button:not([type])').first().click()

    const followUp = page.locator('.form-done a', { hasText: 'Send on WhatsApp' })
    await expect(followUp).toBeVisible()
    const text = decodeURIComponent((await followUp.getAttribute('href')) ?? '')
    expect(text).toContain('Name: E2E WhatsApp test')
    expect(text).toContain('Celebration: Sangeet')
    expect(text).toContain('City / venue: Ahmedabad')
  })
})
