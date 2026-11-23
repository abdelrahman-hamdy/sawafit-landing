// ============================================================
// Sawafit Landing Page — JavaScript Modules
// ============================================================

import '/src/styles/main.css'

// ── Arabic-Indic numeral conversion ─────────────────────────
function toArabicIndic(n) {
  return String(Math.round(n)).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d])
}

function formatCount(n, suffix) {
  if (n >= 1_000_000) return toArabicIndic(n / 1_000_000) + 'م' + suffix
  if (n >= 1_000)     return toArabicIndic(Math.floor(n / 1000)) + '،٠٠٠' + suffix
  return toArabicIndic(n) + suffix
}

// ── Easing ───────────────────────────────────────────────────
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

// ── Reduced Motion ───────────────────────────────────────────
function initReducedMotion() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'))
  }
  return prefersReduced
}

// ── Scroll Reveal ────────────────────────────────────────────
function initScrollReveal(reducedMotion) {
  if (reducedMotion) return

  const elements = document.querySelectorAll('.reveal')

  if (!('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('visible'))
    return
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  )

  elements.forEach(el => observer.observe(el))
}

// ── Counters ─────────────────────────────────────────────────
function initCounters() {
  const counters = document.querySelectorAll('[data-count]')

  if (!('IntersectionObserver' in window)) {
    counters.forEach(el => {
      const target = parseInt(el.dataset.count)
      const suffix = el.dataset.suffix || ''
      el.textContent = formatCount(target, suffix)
    })
    return
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        const el = entry.target
        const target = parseInt(el.dataset.count)
        const suffix = el.dataset.suffix || ''
        const duration = 2000
        const start = performance.now()

        const update = now => {
          const elapsed = now - start
          const progress = Math.min(elapsed / duration, 1)
          el.textContent = formatCount(Math.round(easeOutCubic(progress) * target), suffix)
          if (progress < 1) requestAnimationFrame(update)
        }

        requestAnimationFrame(update)
        observer.unobserve(el)
      })
    },
    { threshold: 0.6 }
  )

  counters.forEach(el => observer.observe(el))
}

// ── Carousel ─────────────────────────────────────────────────
function initCarousel() {
  const track = document.querySelector('.carousel-track')
  const dots  = document.querySelectorAll('.carousel-dot')
  if (!track || !dots.length) return

  let isDragging   = false
  let startX       = 0
  let scrollStart  = 0
  let currentIndex = 0
  const count = dots.length

  const slideWidth = () => {
    const slide = track.querySelector('.carousel-slide')
    return slide ? slide.offsetWidth + 24 : 0
  }

  const updateDots = idx => {
    dots.forEach((dot, i) => {
      const active = i === idx
      dot.classList.toggle('active', active)
      dot.style.background = active ? '#0DC07A' : '#E8F5EE'
      dot.style.width = active ? '24px' : '8px'
    })
  }

  const goTo = idx => {
    currentIndex = Math.max(0, Math.min(idx, count - 1))
    const sw = slideWidth()
    const maxScroll = track.scrollWidth - track.clientWidth
    // RTL: slide 0 is rightmost → maxScroll; slide N is leftmost → 0
    track.scrollTo({ left: Math.max(0, maxScroll - currentIndex * sw), behavior: 'smooth' })
    updateDots(currentIndex)
  }

  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)))

  // Mouse drag
  track.addEventListener('mousedown', e => {
    isDragging  = true
    startX      = e.pageX
    scrollStart = track.scrollLeft
    track.style.scrollBehavior = 'auto'
    track.classList.add('grabbing')
  })

  window.addEventListener('mousemove', e => {
    if (!isDragging) return
    e.preventDefault()
    track.scrollLeft = scrollStart - (e.pageX - startX)
  })

  window.addEventListener('mouseup', e => {
    if (!isDragging) return
    isDragging = false
    track.style.scrollBehavior = 'smooth'
    track.classList.remove('grabbing')
    const dx = e.pageX - startX
    const sw = slideWidth()
    if (Math.abs(dx) > sw / 4) {
      goTo(dx > 0 ? currentIndex - 1 : currentIndex + 1)
    } else {
      goTo(currentIndex)
    }
  })

  // Touch
  let touchX = 0
  track.addEventListener('touchstart', e => {
    touchX = e.touches[0].pageX
    track.style.scrollBehavior = 'auto'
  }, { passive: true })

  track.addEventListener('touchend', e => {
    track.style.scrollBehavior = 'smooth'
    const dx = e.changedTouches[0].pageX - touchX
    const sw = slideWidth()
    if (Math.abs(dx) > sw / 4) {
      goTo(dx > 0 ? currentIndex - 1 : currentIndex + 1)
    }
  }, { passive: true })

  // Sync dots on scroll
  let scrollTimer
  track.addEventListener('scroll', () => {
    clearTimeout(scrollTimer)
    scrollTimer = setTimeout(() => {
      const sw = slideWidth()
      if (!sw) return
      const maxScroll = track.scrollWidth - track.clientWidth
      const idx = Math.round((maxScroll - track.scrollLeft) / sw)
      const clamped = Math.max(0, Math.min(idx, count - 1))
      if (clamped !== currentIndex) {
        currentIndex = clamped
        updateDots(currentIndex)
      }
    }, 60)
  }, { passive: true })

  setTimeout(() => goTo(0), 120)
}

// ── Mobile Nav ───────────────────────────────────────────────
function initMobileNav() {
  const toggle = document.getElementById('menu-toggle')
  const menu   = document.getElementById('mobile-menu')
  const navbar = document.getElementById('navbar')
  if (!toggle || !menu) return

  let isOpen = false
  const bars = toggle.querySelectorAll('.hamburger-bar')

  const open = () => {
    isOpen = true
    menu.style.maxHeight = menu.scrollHeight + 'px'
    bars[0].style.transform = 'rotate(45deg) translate(5px, 5px)'
    bars[1].style.opacity   = '0'
    bars[2].style.transform = 'rotate(-45deg) translate(5px, -5px)'
    toggle.setAttribute('aria-expanded', 'true')
  }
  const close = () => {
    isOpen = false
    menu.style.maxHeight = '0'
    bars[0].style.transform = ''
    bars[1].style.opacity   = ''
    bars[2].style.transform = ''
    toggle.setAttribute('aria-expanded', 'false')
  }

  toggle.addEventListener('click', () => isOpen ? close() : open())
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close))

  // Navbar scroll
  const onScroll = () => {
    navbar.classList.toggle('nav-scrolled', window.scrollY > 20)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
}

// ── Parallax ─────────────────────────────────────────────────
function initParallax(reducedMotion) {
  if (reducedMotion) return
  const blobs = document.querySelectorAll('.hero-blob')
  if (!blobs.length) return

  let ticking = false
  window.addEventListener('scroll', () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      const y = window.scrollY
      blobs.forEach((b, i) => {
        const speed = i === 0 ? 0.25 : 0.4
        const dir   = i === 0 ? 1 : -1
        b.style.transform = `translateY(${y * speed * dir}px)`
      })
      ticking = false
    })
  }, { passive: true })
}

// ── Card 3D Tilt ─────────────────────────────────────────────
function initCardTilt() {
  if (window.matchMedia('(hover: none)').matches) return

  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease'
    })
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect()
      const rx = ((e.clientY - r.top  - r.height / 2) / (r.height / 2)) * -6
      const ry = ((e.clientX - r.left - r.width  / 2) / (r.width  / 2)) *  6
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`
    })
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.4s ease, box-shadow 0.3s ease, border-color 0.3s ease'
      card.style.transform  = ''
    })
  })
}

// ── Bootstrap ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const rm = initReducedMotion()
  initScrollReveal(rm)
  initCounters()
  initCarousel()
  initMobileNav()
  initParallax(rm)
  initCardTilt()
})
