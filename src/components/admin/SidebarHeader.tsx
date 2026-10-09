import React from 'react'
import { ExternalLinkIcon, Icon } from './Brand'

export default function SidebarHeader() {
  return (
    <div className="yda-sidebar-header">
      <div className="yda-sidebar-header__identity">
        <Icon />
        <div>
          <strong>Your Dream Anchor</strong>
          <span>Website editor</span>
        </div>
      </div>
      <a href="/" target="_blank" rel="noopener noreferrer" className="yda-sidebar-header__site">
        View live website
        <ExternalLinkIcon />
      </a>
    </div>
  )
}
