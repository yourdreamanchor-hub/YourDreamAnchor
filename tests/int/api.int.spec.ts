import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest'

let payload: Payload
const created: number[] = []

describe('Inquiries', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  afterAll(async () => {
    if (created.length) {
      await payload.delete({ collection: 'inquiries', where: { id: { in: created } } })
    }
  })

  it('lets a visitor create an enquiry but not set admin-only fields', async () => {
    const doc = await payload.create({
      collection: 'inquiries',
      overrideAccess: false,
      data: {
        name: 'Integration test',
        phone: '0000000000',
        eventType: 'sangeet',
        status: 'booked',
        notes: 'should be stripped',
      },
    })
    created.push(doc.id)

    expect(doc.status).toBe('new')
    expect(doc.notes).toBeFalsy()
  })

  it('emails the anchor when a new enquiry arrives', async () => {
    process.env.NOTIFY_EMAIL = 'alerts@example.com'
    const send = vi.spyOn(payload, 'sendEmail').mockResolvedValue(undefined)
    try {
      const doc = await payload.create({
        collection: 'inquiries',
        overrideAccess: false,
        data: { name: 'Email test <b>', phone: '0000000000', eventType: 'wedding' },
      })
      created.push(doc.id)

      expect(send).toHaveBeenCalledOnce()
      const mail = send.mock.calls[0][0] as { to: string; subject: string; html: string }
      expect(mail.to).toBe('alerts@example.com')
      expect(mail.subject).toContain('Email test')
      expect(mail.html).toContain('Email test &#60;b&#62;')
    } finally {
      send.mockRestore()
      delete process.env.NOTIFY_EMAIL
    }
  })

  it('refuses a fourth enquiry from the same visitor within an hour', async () => {
    const asVisitor = { name: 'Rate limit test', phone: '0000000000', eventType: 'other' as const }
    const existing = await payload.count({
      collection: 'inquiries',
      where: { ipHash: { exists: true } },
    })
    // Earlier tests in this file already used some of this (header-less) visitor's allowance.
    for (let i = existing.totalDocs; i < 3; i++) {
      const doc = await payload.create({ collection: 'inquiries', overrideAccess: false, data: asVisitor })
      created.push(doc.id)
    }
    await expect(
      payload.create({ collection: 'inquiries', overrideAccess: false, data: asVisitor }),
    ).rejects.toThrow(/several enquiries/)
  })

  it('does not let a visitor read enquiries', async () => {
    await expect(
      payload.find({ collection: 'inquiries', overrideAccess: false }),
    ).rejects.toThrow()
  })

  it('serves the home page content publicly', async () => {
    const home = await payload.findGlobal({ slug: 'home', overrideAccess: false })
    expect(home.hero.headline).toBeTruthy()
  })
})
