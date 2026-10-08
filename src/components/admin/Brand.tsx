import React from 'react'

/** Wordmark on the admin login screen. */
export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ color: '#c98f22', fontSize: 28, lineHeight: 1 }}>✦</span>
      <span style={{ fontFamily: 'Georgia, serif', fontSize: 28, letterSpacing: '-0.01em' }}>
        Your Dream Anchor
      </span>
    </div>
  )
}

/** Small mark in the admin's top-left corner. */
export function Icon() {
  return <span style={{ color: '#c98f22', fontSize: 20, lineHeight: 1 }}>✦</span>
}
