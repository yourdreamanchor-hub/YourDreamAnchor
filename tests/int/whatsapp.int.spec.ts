import { describe, expect, it } from 'vitest'

import { whatsappDigits, whatsappUrl } from '@/lib/whatsapp'

describe('WhatsApp links', () => {
  it('accepts the common ways people write an Indian number', () => {
    for (const n of ['+91 87622 25685', '918762225685', '8762225685', '08762225685', '+91-87622-25685']) {
      expect(whatsappDigits(n)).toBe('918762225685')
    }
  })

  it('returns nothing for empty or too-short numbers, so no button is shown', () => {
    expect(whatsappUrl('')).toBeNull()
    expect(whatsappUrl(null)).toBeNull()
    expect(whatsappUrl('12345')).toBeNull()
  })

  it('encodes the pre-filled message', () => {
    expect(whatsappUrl('+91 87622 25685', 'Hi & hello\nDate: 20 Jan')).toBe(
      'https://wa.me/918762225685?text=Hi%20%26%20hello%0ADate%3A%2020%20Jan',
    )
  })
})
