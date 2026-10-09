import React from 'react'
import { brandStrokes } from '@/lib/brand'

function Monogram({ className }: { className: string }) {
  return (
    <svg
      className={className}
      width="28"
      height="28"
      viewBox="-12 -12 175 141"
      fill="currentColor"
      aria-hidden="true"
    >
      {brandStrokes.map((stroke) => (
        <path key={stroke.outline} d={stroke.outline} />
      ))}
    </svg>
  )
}

export function ExternalLinkIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      aria-hidden="true"
    >
      <path d="M4 12 12 4M4 4h8v8" />
    </svg>
  )
}

/** Wordmark on the admin login screen. */
export function Logo() {
  return (
    <div className="yda-admin-logo">
      <Monogram className="yda-admin-logo__mark" />
      <span>
        Your Dream Anchor
        <small>Website administration</small>
      </span>
    </div>
  )
}

/** Small mark in the admin's top-left corner. */
export function Icon() {
  return <Monogram className="yda-admin-icon" />
}
