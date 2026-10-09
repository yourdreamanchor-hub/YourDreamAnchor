import { createHash } from 'crypto'
import {
  APIError,
  type CollectionAfterChangeHook,
  type CollectionBeforeValidateHook,
} from 'payload'

import type { Inquiry } from '../payload-types'
import { siteOrigin } from '../lib/site-origin'

const PER_VISITOR_LIMIT = 3 // enquiries per visitor per hour
const GLOBAL_LIMIT = 30 // public enquiries per 10 minutes, across everyone

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString()

/**
 * Throttles public form submissions. Stores only a salted hash of the visitor's IP, never the IP itself.
 * Counts live in the database because serverless instances don't share memory.
 */
export const rateLimitInquiries: CollectionBeforeValidateHook = async ({
  operation,
  req,
  data,
}) => {
  if (operation !== 'create' || req.user || !data) return data

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  const ipHash = createHash('sha256').update(`${process.env.PAYLOAD_SECRET}:${ip}`).digest('hex')

  const [mine, everyone] = await Promise.all([
    req.payload.count({
      collection: 'inquiries',
      where: {
        and: [{ ipHash: { equals: ipHash } }, { createdAt: { greater_than: minutesAgo(60) } }],
      },
      req,
    }),
    req.payload.count({
      collection: 'inquiries',
      where: {
        and: [{ ipHash: { exists: true } }, { createdAt: { greater_than: minutesAgo(10) } }],
      },
      req,
    }),
  ])

  if (mine.totalDocs >= PER_VISITOR_LIMIT || everyone.totalDocs >= GLOBAL_LIMIT) {
    throw new APIError(
      'We’ve received several enquiries from you already. Please message us on WhatsApp instead.',
      429,
      undefined,
      true,
    )
  }

  return { ...data, ipHash }
}

const fmt = (v?: string | null) => v || '—'

/** Emails the anchor as soon as a new enquiry arrives. */
export const notifyNewInquiry: CollectionAfterChangeHook<Inquiry> = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create') return doc

  const settings = await req.payload.findGlobal({ slug: 'site-settings', req })
  const to = process.env.NOTIFY_EMAIL || settings.email
  if (!to) return doc

  const date = doc.eventDate ? new Date(doc.eventDate).toDateString() : null
  const rows: [string, string][] = [
    ['Name', doc.name],
    ['Phone', doc.phone],
    ['Email', fmt(doc.email)],
    ['Celebration', doc.eventType],
    ['Date', fmt(date)],
    ['City / venue', fmt(doc.city)],
    ['Message', fmt(doc.message)],
  ]
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)
  const adminUrl = `${siteOrigin()}/admin/collections/inquiries/${doc.id}`

  try {
    await req.payload.sendEmail({
      to,
      replyTo: doc.email || undefined,
      subject: `New enquiry: ${doc.name} · ${doc.eventType}${date ? ` · ${date}` : ''}`,
      html: `<h2>New enquiry from the website</h2>
<table cellpadding="6">${rows
        .map(([k, v]) => `<tr><td><b>${k}</b></td><td>${esc(v).replace(/\n/g, '<br>')}</td></tr>`)
        .join('')}</table>
<p><a href="${adminUrl}">Open in admin</a></p>`,
    })
  } catch (err) {
    // The enquiry is already saved; a mail outage must not fail the visitor's submission.
    req.payload.logger.error({ err }, 'Failed to send enquiry notification')
  }
  return doc
}
