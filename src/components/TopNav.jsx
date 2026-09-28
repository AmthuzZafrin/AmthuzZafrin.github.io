import { useEffect, useState } from 'react'
import './TopNav.css'

/** The wordmark stands in for Home, so the links start at About me. */
const TABS = [
  { id: 'summary', label: 'About me' },
  { id: 'projects', label: 'Projects' },
  { id: 'commission', label: 'Websites' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'skills', label: 'Skills' },
  { id: 'novel', label: 'Novel' },
  { id: 'contact', label: 'Contact' },
]

const SECTIONS = ['hero', ...TABS.map((t) => t.id)]

/**
 * The section bar, fixed over the scroll-snap track.
 *
 * The page scrolls a container rather than the window, so a plain #hash link
 * would do nothing useful — each link scrolls `.page` to its section instead,
 * and the current one is read back from the scroll position rather than from
 * whichever link was last clicked, so it stays right when you scroll by hand.
 */
export default function TopNav() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const page = document.querySelector('.page')
    if (!page) return
    // Read straight out of the scroll event rather than deferring to a frame:
    // two layout reads are cheap, the browser already rate-limits scroll, and
    // it keeps the bar correct where rAF is throttled or suspended.
    const read = () => {
      // every section is exactly one viewport tall, so the nearest whole
      // multiple of the scroller's height is the section on screen
      const i = Math.round(page.scrollTop / page.clientHeight)
      setActive(Math.min(SECTIONS.length - 1, Math.max(0, i)))
    }
    read()
    page.addEventListener('scroll', read, { passive: true })
    window.addEventListener('resize', read)
    return () => {
      page.removeEventListener('scroll', read)
      window.removeEventListener('resize', read)
    }
  }, [])

  const go = (id) => {
    const section = document.getElementById(id)
    const page = document.querySelector('.page')
    // No behavior here on purpose: .page already carries scroll-behavior in CSS,
    // and global.css turns it off under prefers-reduced-motion. Forcing 'smooth'
    // would override that preference.
    if (section && page) page.scrollTo({ top: section.offsetTop })
  }

  return (
    <header className="topnav">
      <button type="button" className="topnav__mark" onClick={() => go('hero')}>
        <span className="topnav__given">Amthuz</span> Zafrin
      </button>

      <nav aria-label="Sections">
        <ul className="topnav__list">
          {TABS.map(({ id, label }) => (
            <li key={id}>
              <button
                type="button"
                className={`topnav__link${SECTIONS[active] === id ? ' is-current' : ''}`}
                aria-current={SECTIONS[active] === id ? 'true' : undefined}
                onClick={() => go(id)}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
