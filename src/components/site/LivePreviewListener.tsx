'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'
import React, { useSyncExternalStore } from 'react'

const subscribe = () => () => {}
const currentOrigin = () => window.location.origin
const serverOrigin = () => ''

/** Refreshes the page inside the admin's Live Preview pane whenever the editor saves. */
export function LivePreviewListener() {
  const router = useRouter()
  const origin = useSyncExternalStore(subscribe, currentOrigin, serverOrigin)
  if (!origin) return null
  return <RefreshRouteOnSave refresh={() => router.refresh()} serverURL={origin} />
}
