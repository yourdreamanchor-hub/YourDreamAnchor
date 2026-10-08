/**
 * WhatsApp "click to chat" links: open a chat with a number and a pre-filled message.
 * No API keys needed. https://faq.whatsapp.com/5913398998672934
 */

/** Digits only, with an Indian country code added to bare 10-digit numbers. */
export function whatsappDigits(number?: string | null): string | null {
  const digits = (number ?? '').replace(/\D/g, '').replace(/^0+/, '')
  if (digits.length === 10) return `91${digits}`
  return digits.length >= 11 ? digits : null
}

export function whatsappUrl(number?: string | null, message?: string | null): string | null {
  const digits = whatsappDigits(number)
  if (!digits) return null
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`
}
