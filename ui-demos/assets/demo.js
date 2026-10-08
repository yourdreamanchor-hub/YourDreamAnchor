/* Local prototype interactions. No form data is sent or persisted. */
;(() => {
  'use strict'
  if (new URLSearchParams(location.search).get('embed') === '1')
    document.documentElement.classList.add('embedded')

  const menu = document.querySelector('[data-menu]')
  const toggle = document.querySelector('[data-menu-toggle]')
  const closeMenu = () => {
    if (!menu || !toggle) return
    menu.classList.remove('is-open')
    toggle.setAttribute('aria-expanded', 'false')
    toggle.setAttribute('aria-label', 'Open menu')
  }
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true'
      menu.classList.toggle('is-open', open)
      toggle.setAttribute('aria-expanded', String(open))
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu')
    })
    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu))
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        closeMenu()
        toggle.focus()
      }
    })
    const wide = matchMedia('(min-width: 861px)')
    wide.addEventListener('change', () => {
      if (wide.matches) closeMenu()
    })
  }

  const reels = {
    hero: {
      title: 'Wedding highlights',
      description: 'A few moments from behind the mic.',
      source: 'https://www.instagram.com/yourdreamanchor/',
    },
    wedding: {
      title: 'A happily ever after',
      description: 'Shoonya Farm Retreat, Bengaluru · Wedding',
      source: 'https://www.instagram.com/reel/DeKEPSoRU0I/',
    },
    sangeet: {
      title: 'A night where love took centre stage',
      description: 'Golden Amoon Resort, Bengaluru · Sangeet',
      source: 'https://www.instagram.com/reel/Dcq1M-lR8hz/',
    },
    haldi: {
      title: 'Haldi, but make it a full-blown celebration',
      description: 'MG Magnus, Bengaluru · Haldi',
      source: 'https://www.instagram.com/reel/DeBzehSRgD4/',
    },
    games: {
      title: 'Fastest Finger First',
      description: 'Miraya Greens, Bengaluru · Games & fun',
      source: 'https://www.instagram.com/reel/C7ZxSazKZmH/',
    },
  }
  const dialog = document.querySelector('[data-player]')
  if (dialog) {
    const video = dialog.querySelector('video')
    const playerTitle = dialog.querySelector('[data-player-title]')
    const description = dialog.querySelector('[data-player-description]')
    const status = dialog.querySelector('[data-player-status]')
    const source = dialog.querySelector('[data-player-source]')
    let triggeringButton
    document.querySelectorAll('[data-play]').forEach((button) => {
      button.addEventListener('click', () => {
        const key = button.dataset.play
        if (!reels[key]) return
        const reel = reels[key]
        triggeringButton = button
        playerTitle.textContent = reel.title
        description.textContent = reel.description
        source.href = reel.source
        video.poster = `assets/${key === 'hero' ? 'hero' : key + '-reel'}.webp`
        video.src = `assets/${key}.mp4`
        status.textContent = ''
        dialog.showModal()
        document.documentElement.classList.add('player-open')
        video.play().catch(() => {
          status.textContent = 'Press play to watch this clip.'
        })
      })
    })
    dialog.querySelector('[data-player-close]').addEventListener('click', () => dialog.close())
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return
      const rect = dialog.getBoundingClientRect()
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        dialog.close()
    })
    dialog.addEventListener('close', () => {
      video.pause()
      video.removeAttribute('src')
      video.load()
      document.documentElement.classList.remove('player-open')
      triggeringButton?.focus({ preventScroll: true })
    })
    video.addEventListener('error', () => {
      status.textContent =
        'This local clip could not load. Keep the assets folder beside the HTML file, or watch the original on Instagram.'
    })
  }

  const filterButtons = document.querySelectorAll('[data-filter]')
  const reelItems = document.querySelectorAll('[data-category]')
  const filterStatus = document.querySelector('[data-filter-status]')
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      filterButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)))
      let count = 0
      reelItems.forEach((item) => {
        const show =
          button.dataset.filter === 'all' || item.dataset.category === button.dataset.filter
        item.hidden = !show
        if (show) count++
      })
      if (filterStatus)
        filterStatus.textContent = `${count} ${count === 1 ? 'celebration' : 'celebrations'} shown`
    })
  })

  const form = document.querySelector('[data-enquiry]')
  if (form) {
    const date = form.querySelector('[name="date"]')
    const today = new Date()
    const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    document.querySelectorAll('input[type="date"]').forEach((input) => {
      input.min = minDate
    })
    const phone = form.querySelector('[name="phone"]')
    if (phone) phone.addEventListener('input', () => phone.setCustomValidity(''))
    form.addEventListener('submit', (event) => {
      event.preventDefault()
      if (phone && phone.value.replace(/\D/g, '').length < 7) {
        phone.setCustomValidity('Enter a phone number with at least 7 digits.')
        phone.reportValidity()
        return
      }
      const data = new FormData(form)
      const summary = document.querySelector('[data-enquiry-result]')
      const details = summary.querySelector('[data-enquiry-summary]')
      const name = String(data.get('name') || '').trim()
      const eventType = String(data.get('event') || 'Your celebration')
      const city = String(data.get('city') || '').trim()
      let dateLabel = 'Date to be decided'
      if (data.get('date')) {
        dateLabel = new Intl.DateTimeFormat('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(new Date(`${data.get('date')}T12:00:00`))
      }
      details.textContent = `${name} · ${eventType} · ${dateLabel}${city ? ' · ' + city : ''}`
      summary.hidden = false
      summary.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'nearest',
      })
      summary.focus({ preventScroll: true })
    })
    document.querySelectorAll('[data-event-choice]').forEach((button) => {
      button.addEventListener('click', () => {
        form.querySelector('[name="event"]').value = button.dataset.eventChoice
        document
          .querySelector('#contact')
          .scrollIntoView({
            behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
          })
      })
    })
    const quick = document.querySelector('[data-quick-date]')
    if (quick)
      quick.addEventListener('submit', (event) => {
        event.preventDefault()
        const data = new FormData(quick)
        date.value = String(data.get('date') || '')
        form.querySelector('[name="city"]').value = String(data.get('city') || '')
        const status = document.querySelector('[data-prefill-status]')
        if (status)
          status.textContent =
            'Your date and city are filled in below. Add your name and celebration to preview the enquiry.'
        document
          .querySelector('#contact')
          .scrollIntoView({
            behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
          })
        form.querySelector('[name="name"]').focus({ preventScroll: true })
      })
  }

  const background = document.querySelector('[data-background-video]')
  const backgroundToggle = document.querySelector('[data-background-toggle]')
  if (background && backgroundToggle) {
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    let userPaused = preference.matches
    const sync = () => {
      const playing = !background.paused
      backgroundToggle.setAttribute('aria-pressed', String(playing))
      backgroundToggle.querySelector('span').textContent = playing ? 'Pause film' : 'Play film'
    }
    background.addEventListener('play', sync)
    background.addEventListener('pause', sync)
    backgroundToggle.addEventListener('click', () => {
      userPaused = !background.paused
      if (background.paused) background.play().catch(() => {})
      else background.pause()
    })
    preference.addEventListener('change', () => {
      if (preference.matches) {
        userPaused = true
        background.pause()
      }
    })
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !userPaused) background.play().catch(() => {})
        else background.pause()
      },
      { threshold: 0.1 },
    )
    observer.observe(background)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) background.pause()
    })
    sync()
  }
})()
