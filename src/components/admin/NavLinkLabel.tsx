'use client'

import { useRowLabel } from '@payloadcms/ui'

export default function NavLinkLabel() {
  const { data, rowNumber } = useRowLabel<{ label?: string }>()
  return <span>{data.label || `Header link ${(rowNumber ?? 0) + 1}`}</span>
}
