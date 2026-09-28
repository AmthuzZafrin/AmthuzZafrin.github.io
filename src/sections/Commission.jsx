import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useInView } from '../hooks/useInView.js'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import './Commission.css'

/**
 * The other half of the work.
 *
 * The section before this one is three AI products, all of them mine. This one
 * is a site built for somebody else, which is a different job and worth being
 * a different page: there is no scatter of artwork to open, just the thing
 * itself running, and an address you can go and check it at.
 */
export default function Commission() {
  const [ref, inView] = useInView({ threshold: 0.25 })
  const reduced = usePrefersReducedMotion()

  /**
   * This page scrolls freely in the middle and stops at both ends.
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
   * you on the bottom, which is what .commission__end is for.
   *
   * The eight pixels are hysteresis, and they are not optional. Without them
   * the bottom edge is both the point where snapping switches on and the
   * position it snaps you to, so it would switch off again on arrival and
   * oscillate.
   */
  useEffect(() => {
    const page = document.querySelector('.page')
    const here = document.getElementById('commission')
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
      // Never leave the rest of the site unsnapped because this one unmounted.
      page.style.scrollSnapType = ''
    }
  }, [])

  const rise = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 18 },
    shown: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0.4 : 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  }

  const stage = {
    hidden: { opacity: 0 },
    shown: {
      opacity: 1,
      transition: {
        duration: reduced ? 0.4 : 0.6,
        staggerChildren: reduced ? 0 : 0.1,
        delayChildren: reduced ? 0 : 0.12,
      },
    },
  }

  return (
    <section id="commission" className="section section--center" ref={ref}>
      <motion.h2
        className="section-title commission__title"
        variants={rise}
        initial="hidden"
        animate={inView ? 'shown' : 'hidden'}
      >
        The Full-stack work
      </motion.h2>

      <motion.p
        className="section-sub"
        variants={rise}
        initial="hidden"
        animate={inView ? 'shown' : 'hidden'}
      >
        A website built for my client Kala Master, and live in{' '}
        {/* The address is the one thing on this page worth clicking, and the
            row that used to carry it underneath is gone — so it is a link
            where it is said. */}
        <a
          className="commission__link"
          href="https://kalamaster.in"
          target="_blank"
          rel="noreferrer noopener"
        >
          kalamaster.in
        </a>
        .
      </motion.p>

      <motion.div
        className="commission__stage"
        variants={stage}
        initial="hidden"
        animate={inView ? 'shown' : 'hidden'}
      >
        <motion.figure className="commission__frame is-kala" variants={rise}>
          {/* muted as well as silent: the capture carries no audio track at
              all, and this is the part that says so to the browser. */}
          <video
            src="/projects/kalamaster.mp4"
            poster="/projects/kalamaster-poster.webp"
            controls
            muted
            playsInline
            preload="metadata"
          />
        </motion.figure>

        <motion.p className="section-sub commission__sub" variants={rise}>
          And one for my own app, BUBU &mdash; live at{' '}
          <a
            className="commission__link"
            href="https://heybubu.in"
            target="_blank"
            rel="noreferrer noopener"
          >
            heybubu.in
          </a>
          .
        </motion.p>

        <motion.figure className="commission__frame is-bubu" variants={rise}>
          {/* Cut to begin on the blank frame three seconds in, so the site is
              watched building itself rather than caught already built. Its
              poster is therefore not its first frame — see the prep script. */}
          <video
            src="/projects/bubu-site.mp4"
            poster="/projects/bubu-site-poster.webp"
            controls
            muted
            playsInline
            preload="metadata"
          />
        </motion.figure>
      </motion.div>

      {/* The section's own end, as a snap point. .section aligns its start, and
          an element can only align one edge — so the other end needs a box of
          its own sitting on it. */}
      <div className="commission__end" aria-hidden="true" />
    </section>
  )
}
