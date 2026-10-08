'use client'

import Link from 'next/link'
import React, { useState } from 'react'

import { whatsappUrl } from '@/lib/whatsapp'

import { WhatsAppIcon } from './WhatsAppButton'

type Option = { label: string; value: string }

type Props = {
  eventTypes: Option[]
  successMessage: string
  whatsappNumber?: string | null
  anchorFirstName: string
}

/** Turns the submitted enquiry into a ready-to-send WhatsApp message. */
function enquiryMessage(body: Record<string, FormDataEntryValue>, eventTypes: Option[], to: string) {
  const event = eventTypes.find((t) => t.value === body.eventType)?.label ?? body.eventType
  const date = body.eventDate
    ? new Date(String(body.eventDate)).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null
  return [
    `Hi ${to}! I just sent an enquiry on your website.`,
    '',
    `Name: ${body.name}`,
    `Celebration: ${event}`,
    date && `Date: ${date}`,
    body.city && `City / venue: ${body.city}`,
    body.message && `About it: ${body.message}`,
  ]
    .filter((line): line is string => typeof line === 'string')
    .join('\n')
}

export function InquiryForm({ eventTypes, successMessage, whatsappNumber, anchorFirstName }: Props) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [followUp, setFollowUp] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    // Honeypot: real people never fill this hidden field.
    if (form.get('website')) return setState('done')

    setState('sending')
    setError(null)
    const body = Object.fromEntries(
      [...form.entries()].filter(([k, v]) => k !== 'website' && String(v).trim() !== ''),
    )
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setFollowUp(whatsappUrl(whatsappNumber, enquiryMessage(body, eventTypes, anchorFirstName)))
        return setState('done')
      }
      const json = await res.json().catch(() => null)
      setError(json?.errors?.[0]?.message ?? null)
      setState('error')
    } catch {
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="form-done" role="status">
        <span className="form-done__icon" aria-hidden>
          ✦
        </span>
        <p>{successMessage}</p>
        {followUp && (
          <>
            <p className="form-done__hint">Want a faster reply? Send the same details on WhatsApp.</p>
            <a href={followUp} target="_blank" rel="noreferrer" className="btn btn--whatsapp">
              <WhatsAppIcon size={20} />
              Send on WhatsApp
            </a>
          </>
        )}
      </div>
    )
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="form__row">
        <label>
          <span>Your name *</span>
          <input name="name" required maxLength={120} autoComplete="name" />
        </label>
        <label>
          <span>Phone / WhatsApp *</span>
          <input name="phone" required maxLength={30} type="tel" autoComplete="tel" />
        </label>
      </div>
      <div className="form__row">
        <label>
          <span>Celebration *</span>
          <select name="eventType" required defaultValue="">
            <option value="" disabled>
              Choose one
            </option>
            {eventTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Date</span>
          <input name="eventDate" type="date" />
        </label>
      </div>
      <div className="form__row">
        <label>
          <span>City / venue</span>
          <input name="city" maxLength={120} />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" />
        </label>
      </div>
      <label>
        <span>Tell us about the celebration</span>
        <textarea name="message" rows={4} maxLength={3000} placeholder="Number of functions, guests, the vibe you want…" />
      </label>
      <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden />
      <button className="btn btn--gold btn--lg" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Send enquiry'}
      </button>
      <p className="form__note">
        We only use your details to reply about your event. <Link href="/privacy">Privacy policy</Link>
      </p>
      {state === 'error' && (
        <p className="form__error" role="alert">
          {error ?? 'Something went wrong. Please try again or message us on WhatsApp.'}
        </p>
      )}
    </form>
  )
}
