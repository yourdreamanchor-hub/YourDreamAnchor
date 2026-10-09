'use client'

import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

export default function HeroFilmLabel() {
  const { data, rowNumber } = useRowLabel<{ label?: string; enabled?: boolean }>()
  return (
    <span>
      {data?.label || `Film ${Number(rowNumber) + 1}`}
      {data?.enabled === false ? ' · Hidden' : ''}
    </span>
  )
}
