import { useState } from 'react'
import { motion } from 'framer-motion'
import { useZoom } from '../components/Zoom.jsx'
import { useInView } from '../hooks/useInView.js'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import './Novel.css'

/**
 * The five plates of the book. Any of them can be promoted into the main
 * frame, so they are all exported at the frame's own width — see public/novel/.
 */
const PLATES = {
  cover: { alt: 'The Inevitable — front cover', label: 'Front cover' },
  back: { alt: 'The Inevitable — back cover', label: 'Back cover' },
  copyright: { alt: 'The Inevitable — copyright page', label: 'Copyright' },
  chapter1: { alt: 'The Inevitable — Chapter One, The Lamp Between Them', label: 'Chapter One' },
  email: { alt: 'The Inevitable — the closing letter', label: 'Closing letter' },
}

/** The four that start in the rail, in the order they run in the book. */
const OPENING_RAIL = ['back', 'copyright', 'chapter1', 'email']

/**
 * Where to buy it, from the KDP listing.
 *
 * Both point at amazon.com because both editions are live there and it is the
 * one store every reader can reach; the two ASINs are what make the link, and
 * Amazon resolves them in each territory. The Kindle is sold in twelve
 * countries and the paperback in fourteen — overlapping but not the same list,
 * which is why the two are counted separately rather than lumped together.
 */
const EDITIONS = [
  { label: 'Kindle edition', asin: 'B0HK7CBY2Z' },
  { label: 'Paperback', asin: '9334489782' },
]

/**
 * The novel, laid out like a product gallery: a strip of pages down the left,
 * the main plate held large beside it inside a lit rim, the copy to the right
 * on the page itself rather than in a panel.
 *
 * Clicking a page puts it in the main frame and whatever was there takes the
 * vacated slot, so the rail keeps its four positions.
 */
export default function Novel() {
  const [ref, inView] = useInView({ threshold: 0.3 })
  const zoom = useZoom()
  const reduced = usePrefersReducedMotion()
  const [featured, setFeatured] = useState('cover')
  const [rail, setRail] = useState(OPENING_RAIL)

  const promote = (id) => {
    setRail(rail.map((slot) => (slot === id ? featured : slot)))
    setFeatured(id)
  }

  const stage = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 22 },
    shown: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduced ? 0.4 : 0.6,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: reduced ? 0 : 0.06,
        delayChildren: reduced ? 0 : 0.14,
      },
    },
  }

  const pop = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, scale: 0.7 },
    shown: {
      opacity: 1,
      scale: 1,
      transition: { duration: reduced ? 0.4 : 0.55, ease: [0.34, 1.4, 0.64, 1] },
    },
  }

  const rise = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 14 },
    shown: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0.4 : 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  }

  return (
    <section id="novel" className="section section--center" ref={ref}>
      <motion.h2
        className="section-title novel__title"
        variants={pop}
        initial="hidden"
        animate={inView ? 'shown' : 'hidden'}
      >
        The Story
      </motion.h2>

      <motion.p
        className="section-sub"
        variants={pop}
        initial={'hidden'}
        animate={inView ? 'shown' : 'hidden'}
      >
        A novel written and published between shipping software.
      </motion.p>

      <motion.div
        className="novel__stage"
        variants={stage}
        initial="hidden"
        animate={inView ? 'shown' : 'hidden'}
      >
        <div className="novel__rail">
          {rail.map((id) => (
            <motion.button
              type="button"
              key={id}
              className="novel__thumb"
              variants={pop}
              aria-label={`Show ${PLATES[id].label}`}
              onClick={() => promote(id)}
            >
              <img src={`/novel/${id}.webp`} alt={PLATES[id].alt} />
            </motion.button>
          ))}
        </div>

        <motion.figure className="novel__feature" variants={pop}>
          {/* Keyed on the plate so a swap arrives rather than cross-fading one
              image into another at the same size. The plate on show opens; the
              ones on the rail are the control that put it there. */}
          <img
            key={featured}
            {...zoom({
              src: `/novel/${featured}.webp`,
              alt: PLATES[featured].alt,
              name: PLATES[featured].label,
            })}
          />
        </motion.figure>

        <div className="novel__copy">
          <motion.p className="novel__eyebrow" variants={rise}>
            Out now · Kindle Edition
          </motion.p>

          <motion.h3 className="novel__name" variants={rise}>
            The Inevitable
          </motion.h3>
          <motion.p className="novel__tagline" variants={rise}>
            Born unwanted. Became unstoppable.
          </motion.p>
          <motion.p className="novel__author" variants={rise}>
            Amthuz Zafrin
          </motion.p>

          <motion.p className="novel__blurb" variants={rise}>
            Zara is born into a family that already knows what it wants a son to be, and has no
            idea what to do with a daughter. She spends her childhood earning her way out — a
            scholarship, a medical degree, a promise made to her mother. Her brother inherits
            every expectation and none of the freedom to refuse it. Only one of them survives
            what the family expected of them.
          </motion.p>
          <motion.p className="novel__blurb novel__blurb--mine" variants={rise}>
            I wrote it, mostly at night, in between shipping software. I also typeset it,
            designed the cover, and published it. It&rsquo;s the only thing on this site I built
            without a compiler telling me when I got it wrong.
          </motion.p>

          <motion.div className="novel__buy" variants={rise}>
            {EDITIONS.map(({ label, asin }) => (
              <a
                key={asin}
                className="novel__buy-link"
                href={`https://www.amazon.com/dp/${asin}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                {label}
              </a>
            ))}
          </motion.div>

          <motion.p className="novel__where" variants={rise}>
            Kindle in twelve countries, paperback in fourteen.
          </motion.p>

        </div>
      </motion.div>
    </section>
  )
}
