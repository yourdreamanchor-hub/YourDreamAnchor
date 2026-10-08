'use client'

import { useEffect } from 'react'

/** Enhances the visible page with one-time entrances and a restrained opening scene. */
export function Reveal() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('main#top')
    if (!root || !('IntersectionObserver' in window) || !Element.prototype.animate) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const compact = window.matchMedia('(max-width: 700px), (pointer: coarse)')
    const pending = new Set<HTMLElement>()
    const animations = new Map<Animation, HTMLElement>()
    const hero = root.querySelector<HTMLElement>('.hero')
    const backdrop = hero?.querySelector<HTMLElement>('.hero__video')
    let heroInView = false
    let heroHeight = hero?.offsetHeight ?? 0
    let frame = 0

    const animate = (el: HTMLElement, keyframes: Keyframe[], duration: number, delay = 0) => {
      const animation = el.animate(keyframes, {
        duration,
        delay,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'both',
      })
      animations.set(animation, el)
      // Release the animated styles so hover states and the existing composition keep working.
      animation.onfinish = () => {
        animations.delete(animation)
        animation.cancel()
      }
    }

    const show = (el: HTMLElement) => {
      pending.delete(el)
      el.classList.remove('is-pending')
      el.classList.add('is-in')
      entrances.unobserve(el)
    }

    const entrances = new IntersectionObserver(
      (entries) => {
        const arriving = entries.filter((entry) => entry.isIntersecting)
        for (const entry of arriving) {
          const el = entry.target as HTMLElement
          if (!pending.has(el)) continue
          show(el)
          // Anchor jumps, keyboard focus and restored scroll positions should show content immediately.
          if (
            reduce.matches ||
            document.hidden ||
            entry.boundingClientRect.top < 0 ||
            el.matches(':focus-within')
          )
            continue

          const group = el.closest('[data-reveal-group]')
          const preceding = group
            ? arriving.filter(
                (other) =>
                  other.target !== el &&
                  other.target.closest('[data-reveal-group]') === group &&
                  Math.abs(other.boundingClientRect.top - entry.boundingClientRect.top) < 24 &&
                  other.boundingClientRect.left < entry.boundingClientRect.left,
              ).length
            : 0
          const delay = Math.min(preceding, 3) * 55
          const type = el.dataset.reveal

          if (type === 'photo' || type === 'portrait') {
            animate(el, [{ opacity: 0 }, { opacity: 1 }], 560, delay)
            const image = el.querySelector<HTMLElement>('img')
            if (image)
              animate(
                image,
                [
                  { clipPath: 'inset(0 0 16% 0)', scale: type === 'portrait' ? '1' : '1.025' },
                  { clipPath: 'inset(0 0 0% 0)', scale: '1' },
                ],
                760,
                delay,
              )
            const caption = type === 'portrait' && el.querySelector<HTMLElement>('figcaption')
            if (caption)
              animate(
                caption,
                [
                  { opacity: 0, translate: '0 12px' },
                  { opacity: 1, translate: '0 0' },
                ],
                540,
                150,
              )
          } else if (type === 'heading' || type === 'quote') {
            animate(el, [{ opacity: 0 }, { opacity: 1 }], 500, delay)
            const title = el.querySelector<HTMLElement>('h2')
            if (title) animate(title, [{ translate: '0 12px' }, { translate: '0 0' }], 620, delay)
          } else {
            const distance = compact.matches ? 12 : type === 'card' ? 22 : 16
            animate(
              el,
              [
                { opacity: 0, translate: `0 ${distance}px` },
                { opacity: 1, translate: '0 0' },
              ],
              640,
              delay,
            )
          }
        }
      },
      { rootMargin: '0px 0px -24px 0px', threshold: 0.06 },
    )

    // Only prepare content below the screen. Server-rendered and initially visible content stays visible.
    if (!reduce.matches) {
      root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight - 24) return
        pending.add(el)
        el.classList.add('is-pending')
        entrances.observe(el)
      })
    }

    const updateScene = () => {
      frame = 0
      if (!hero || !backdrop || reduce.matches || compact.matches || document.hidden || !heroInView)
        return
      const progress = Math.min(1, Math.max(0, window.scrollY / Math.max(heroHeight, 1)))
      // A small movement of the film gives the stage depth as the visitor enters Akshay's story.
      backdrop.style.transform = `translate3d(0, ${(progress * Math.min(heroHeight * 0.12, 90)).toFixed(2)}px, 0) scale(1.04)`
    }
    const scheduleScene = () => {
      if (!frame && heroInView && !reduce.matches && !compact.matches && !document.hidden) {
        frame = window.requestAnimationFrame(updateScene)
      }
    }
    const updateDepth = () => {
      backdrop?.classList.toggle(
        'is-depth-active',
        heroInView && !reduce.matches && !compact.matches && !document.hidden,
      )
    }
    const visibility = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === hero) heroInView = entry.isIntersecting
      })
      updateDepth()
      scheduleScene()
    })
    if (hero) visibility.observe(hero)

    const cancelAnimations = () => {
      animations.forEach((_, animation) => animation.cancel())
      animations.clear()
    }
    const onPreferenceChange = () => {
      if (reduce.matches) {
        pending.forEach(show)
        cancelAnimations()
      }
      if (reduce.matches || compact.matches) {
        window.cancelAnimationFrame(frame)
        frame = 0
        backdrop?.style.removeProperty('transform')
      }
      updateDepth()
      scheduleScene()
    }
    const onVisibilityChange = () => {
      if (document.hidden) cancelAnimations()
      updateDepth()
      scheduleScene()
    }
    const onFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return
      const el = event.target.closest<HTMLElement>('[data-reveal]')
      if (!el) return
      show(el)
      animations.forEach((target, animation) => {
        if (el.contains(target)) {
          animation.cancel()
          animations.delete(animation)
        }
      })
    }
    const onResize = () => {
      heroHeight = hero?.offsetHeight ?? 0
      scheduleScene()
    }
    const resize = 'ResizeObserver' in window ? new ResizeObserver(onResize) : null
    if (hero) resize?.observe(hero)
    window.addEventListener('scroll', scheduleScene, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    root.addEventListener('focusin', onFocus)
    document.addEventListener('visibilitychange', onVisibilityChange)
    reduce.addEventListener('change', onPreferenceChange)
    compact.addEventListener('change', onPreferenceChange)

    return () => {
      entrances.disconnect()
      visibility.disconnect()
      resize?.disconnect()
      window.cancelAnimationFrame(frame)
      cancelAnimations()
      pending.forEach((el) => el.classList.remove('is-pending'))
      pending.clear()
      backdrop?.style.removeProperty('transform')
      backdrop?.classList.remove('is-depth-active')
      window.removeEventListener('scroll', scheduleScene)
      window.removeEventListener('resize', onResize)
      root.removeEventListener('focusin', onFocus)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      reduce.removeEventListener('change', onPreferenceChange)
      compact.removeEventListener('change', onPreferenceChange)
    }
  }, [])

  return null
}
