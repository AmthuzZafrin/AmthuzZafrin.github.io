import { useEffect, useRef, useState } from 'react'
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
 *
 * The bar also wears the current section's colour. It does that by reading the
 * section's own tokens rather than by keeping a table of nine colours here:
 * the palette lives in each section's stylesheet, where it is next to the
 * things it colours, and a copy of it in this file would be one more thing to
 * keep in step. Reading it also picks up the one section that has three
 * palettes — Projects recolours its heading per project — for free.
 */
export default function TopNav() {
  const [active, setActive] = useState(0)

  const bar = useRef(null)

  useEffect(() => {
    const page = document.querySelector('.page')
    if (!page) return
    // Read straight out of the scroll event rather than deferring to a frame:
    // the browser already rate-limits scroll, and it keeps the bar correct
    // where rAF is throttled or suspended.
    const read = () => {
      // Whichever section the middle of the window is in. This used to divide
      // the scroll position by the window height and round, on the assumption
      // that every section is exactly one viewport tall — but Websites is not,
      // it runs to about one and four fifths, so every section after it came
      // out one place short and the bar lit the wrong tab for half the page.
      // Measured offsets cost a handful of reads and do not care how tall
      // anything is.
      const mid = page.scrollTop + page.clientHeight / 2
      let i = 0
      for (let k = 1; k < SECTIONS.length; k++) {
        const el = document.getElementById(SECTIONS[k])
        if (el && el.offsetTop <= mid) i = k
      }
      setActive(i)
    }
    read()
    page.addEventListener('scroll', read, { passive: true })
    window.addEventListener('resize', read)
    return () => {
      page.removeEventListener('scroll', read)
      window.removeEventListener('resize', read)
    }
  }, [])

  // The bar takes the section's colour. Separate from the scroll handler on
  // purpose: this writes to the header, and a write in among the offsetTop
  // reads above would make the browser lay out again on every scroll event.
  useEffect(() => {
    const barEl = bar.current
    const host = document.getElementById(SECTIONS[active])
    if (!barEl || !host) return

    const paint = () => {
      // The heading first, because that is where a section that has more than
      // one palette puts it — .projects__title carries the selected project's
      // three stops. The home page has no .section-title, so it falls through
      // to the .section inside its pin wrapper, which is where .hero's
      // tokens are.
      const from =
        host.querySelector('.section-title') || host.querySelector('.section') || host
      const seen = getComputedStyle(from)
      const take = (to, ...names) => {
        for (const name of names) {
          const value = seen.getPropertyValue(name).trim()
          if (value) {
            barEl.style.setProperty(to, value)
            return
          }
        }
      }
      // The links at rest match the section's caption, and the three lit
      // things — the current tab, the wordmark and the line under the bar —
      // match its heading, top stop to bottom.
      take('--tab', '--sub-color', '--fg-muted')
      take('--tab-hi', '--title-top')
      take('--tab-on', '--title-color')
      take('--tab-deep', '--title-deep')
    }

    paint()

    // Projects changes colour without anybody scrolling: the selected project
    // is a class on the section, so the palette can move under a stationary
    // bar. Nothing else on the site repaints itself this way.
    const watch = new MutationObserver(paint)
    watch.observe(host, { attributes: true, attributeFilter: ['class'] })
    return () => watch.disconnect()
  }, [active])

  const go = (id) => {
    const section = document.getElementById(id)
    const page = document.querySelector('.page')
    // No behavior here on purpose: .page already carries scroll-behavior in CSS,
    // and global.css turns it off under prefers-reduced-motion. Forcing 'smooth'
    // would override that preference.
    if (section && page) page.scrollTo({ top: section.offsetTop })
  }

  return (
    <header className="topnav" ref={bar}>
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
