'use client'

import type { DefaultCellComponentProps } from 'payload'
import React from 'react'

export function FileType({ cellData }: DefaultCellComponentProps) {
  const mime = typeof cellData === 'string' ? cellData : ''
  const type = mime.startsWith('image/') ? 'Photo' : mime.startsWith('video/') ? 'Video' : 'File'
  const formats: Record<string, string> = { jpeg: 'JPG', 'svg+xml': 'SVG', quicktime: 'MOV' }
  const subtype = mime.split('/')[1] || ''
  const format = formats[subtype] || subtype.toUpperCase()

  return (
    <span className="yda-file-type">
      <span>{type}</span>
      {format && <small>{format}</small>}
    </span>
  )
}

export function FileSize({ cellData }: DefaultCellComponentProps) {
  if (typeof cellData !== 'number' || !Number.isFinite(cellData) || cellData < 0)
    return <span>Size unavailable</span>
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = cellData
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return (
    <span className="yda-file-size">
      {new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(value)} {units[unit]}
    </span>
  )
}
