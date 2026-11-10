import { useEffect } from 'react'

/**
 * Lets a section taller than the window scroll freely in the middle and stop
 * at both ends. Websites always is that tall; Research is once a narrow
 * window stacks its columns.
 *
 * The track is `scroll-snap-type: y mandatory`, which means the scroll must
 * always come to rest on a snap point — so a section that simply opts out
 * with `scroll-snap-align: none` does not become free, it becomes
 * impossible to stop on. The only way to scroll through a region is for
 * snapping not to be in force while you are in it.
 *
 * But it has to be in force at the two edges, or the section has no ends:
 * you would drift out of the bottom of it and into the next page without
 * anything marking the join. So snapping is off only while the section
 * covers the window in both directions — there is more of it above and more
 * below, and therefore something to scroll — and on the moment either edge
 * comes into view. Arriving, that lands you on the top; leaving, it lands
 * you on the bottom, which is what the section's .section-end is for.
 *
 * The eight pixels are hysteresis, and they are not optional. Without them
 * the bottom edge is both the point where snapping switches on and the
 * position it snaps you to, so it would switch off again on arrival and
 * oscillate.
 *
 * Two sections can use this at once without fighting over the track: each
 * one writes only when its own answer changes, and no two sections can both
 * cover the window at the same moment.
 */
export function useScrollThrough(id) {
  useEffect(() => {
    const page = document.querySelector('.page')
    const here = document.getElementById(id)
    if (!page || !here) return undefined

    let free = false
    const read = () => {
      const box = here.getBoundingClientRect()
      const tall = window.innerHeight
      const want = box.top <= -8 && box.bottom >= tall + 8
      if (want === free) return
      free = want
      page.style.scrollSnapType = want ? 'none' : ''
    }

    read()
    // A scroll listener rather than thresholds: this turns on a few pixels
    // either side of an edge, and an IntersectionObserver on a target nearly
    // twice the window's height cannot resolve that finely.
    page.addEventListener('scroll', read, { passive: true })
    window.addEventListener('resize', read)

    return () => {
      page.removeEventListener('scroll', read)
      window.removeEventListener('resize', read)
      // Never leave the rest of the site unsnapped because this one unmounted
      // — but only undo what this section did, not what another one is doing.
      if (free) page.style.scrollSnapType = ''
    }
  }, [id])
}
