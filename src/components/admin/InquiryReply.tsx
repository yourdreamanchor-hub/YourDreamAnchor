'use client'

import { useFormFields } from '@payloadcms/ui'
import React from 'react'

import { whatsappUrl } from '@/lib/whatsapp'

/** Sidebar buttons on an enquiry: reply on WhatsApp, call, or email in one click. */
export default function InquiryReply() {
  const { name, phone, email, eventType } = useFormFields(([fields]) => ({
    name: fields.name?.value as string | undefined,
    phone: fields.phone?.value as string | undefined,
    email: fields.email?.value as string | undefined,
    eventType: fields.eventType?.value as string | undefined,
  }))

  const firstName = name?.split(' ')[0] ?? 'there'
  const greeting = `Hi ${firstName}, this is Akshay from Your Dream Anchor. Thank you for your enquiry${
    eventType ? ` about your ${eventType.replace('-', ' / ')}` : ''
  }!`
  const wa = whatsappUrl(phone, greeting)

  if (!phone && !email) return null

  return (
    <div className="yda-reply">
      <span className="yda-reply__label">Reply</span>
      {wa && (
        <a className="yda-reply__whatsapp" href={wa} target="_blank" rel="noreferrer">
          WhatsApp {firstName}
        </a>
      )}
      {phone && <a href={`tel:${phone.replace(/\s/g, '')}`}>Call {phone}</a>}
      {email && (
        <a href={`mailto:${email}?subject=${encodeURIComponent('Your enquiry · Your Dream Anchor')}`}>
          Email {firstName}
        </a>
      )}
    </div>
  )
}
