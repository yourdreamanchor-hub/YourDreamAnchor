import React from 'react'

/** Renders `*word*` in a heading as gold italic emphasis. */
export function Accent({ text }: { text?: string | null }) {
  if (!text) return null
  return (
    <>
      {text.split(/(\*[^*]+\*)/g).map((part, i) =>
        part.startsWith('*') && part.endsWith('*') ? <em key={i}>{part.slice(1, -1)}</em> : part,
      )}
    </>
  )
}
