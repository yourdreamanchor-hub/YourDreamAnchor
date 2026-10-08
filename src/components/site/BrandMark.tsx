import React, { useId } from 'react'

import { brandStrokes, monogramUrl } from '@/lib/brand'

export function BrandMark({
  src = monogramUrl,
  className,
  animated = false,
}: {
  src?: string
  className?: string
  animated?: boolean
}) {
  const id = useId().replace(/:/g, '')
  if (src !== monogramUrl) {
    return <img className={className} src={src} alt="" width={151} height={117} />
  }

  return (
    <svg
      className={className}
      width="151"
      height="117"
      viewBox="-1 -1 153 119"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {animated && (
        <defs>
          {brandStrokes.map((stroke, index) => (
            <mask
              key={index}
              id={`${id}-stroke-${index}`}
              maskUnits="userSpaceOnUse"
              x="-12"
              y="-12"
              width="175"
              height="141"
            >
              <path
                className="brand-mark__draw"
                d={stroke.draw}
                pathLength="1"
                fill="none"
                stroke="white"
                strokeWidth="26"
                style={
                  {
                    '--stroke-delay': `${stroke.delay}ms`,
                    '--stroke-duration': `${stroke.duration}ms`,
                  } as React.CSSProperties
                }
              />
            </mask>
          ))}
        </defs>
      )}
      {brandStrokes.map((stroke, index) => (
        <path
          key={index}
          d={stroke.outline}
          mask={animated ? `url(#${id}-stroke-${index})` : undefined}
        />
      ))}
    </svg>
  )
}
