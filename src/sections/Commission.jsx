import { motion } from 'framer-motion'
import { useInView } from '../hooks/useInView.js'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import { useScrollThrough } from '../hooks/useScrollThrough.js'
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

  // This page scrolls freely in the middle and stops at both ends — see the
  // hook for how, and for why snapping cannot simply be switched off here.
  useScrollThrough('commission')

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
      <div className="section-end" aria-hidden="true" />
    </section>
  )
}
