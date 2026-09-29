import { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { useInView } from '../hooks/useInView.js'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import './Contact.css'

/**
 * The turning object is real geometry rendered by three, which is a couple of
 * hundred kilobytes of renderer. It is loaded when the section is first
 * reached rather than with the page: nobody who never scrolls this far should
 * pay for an ornament at the bottom of it.
 */
const ContactScene = lazy(() => import('../components/ContactScene.jsx'))

/**
 * Three ways in, in the order someone is most likely to use them.
 *
 * `shown` is what is printed and `href` is where it goes: the scheme and the
 * www are machinery, and a line of address on a page is read rather than
 * typed. The addresses themselves are unchanged — both links point at exactly
 * what they say they do.
 */
const WAYS = [
  {
    label: 'Email',
    shown: 'amthuzzafrin@gmail.com',
    href: 'mailto:amthuzzafrin@gmail.com',
  },
  {
    label: 'LinkedIn',
    shown: 'linkedin.com/in/amthuzzafrin09',
    href: 'https://www.linkedin.com/in/amthuzzafrin09/',
    away: true,
  },
  {
    label: 'GitHub',
    shown: 'github.com/AmthuzZafrin',
    href: 'https://github.com/AmthuzZafrin',
    away: true,
  },
]

export default function Contact() {
  const [ref, inView] = useInView({ threshold: 0.25 })
  const reduced = usePrefersReducedMotion()

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
        staggerChildren: reduced ? 0 : 0.08,
        delayChildren: reduced ? 0 : 0.1,
      },
    },
  }

  return (
    <section id="contact" className="section section--center" ref={ref}>
      <motion.h2
        className="section-title contact__title"
        variants={rise}
        initial="hidden"
        animate={inView ? 'shown' : 'hidden'}
      >
        Have an idea?
        {/* A straight apostrophe, not the typographer's curly one: Madane
            has the first and not the second, and a serif ’ dropped into a
            heading set in a heavy geometric face reads as a mistake. */}
        <span className="contact__title-line">Let&apos;s make it real.</span>
      </motion.h2>

      <motion.div
        className="contact__stage"
        variants={stage}
        initial="hidden"
        animate={inView ? 'shown' : 'hidden'}
      >
        {/* Decoration, and it says nothing the column beside it does not say
            better, so it is hidden from anything reading the page aloud. */}
        <motion.div className="contact__turn" variants={rise} aria-hidden="true">
          {inView && (
            <Suspense fallback={null}>
              <ContactScene />
            </Suspense>
          )}
        </motion.div>

        <div className="contact__column">
          <motion.p className="contact__lede" variants={rise}>
            I&rsquo;m always open to interesting conversations, creative collaborations, and
            opportunities to build something impactful with technology.
          </motion.p>

          <ul className="contact__ways">
            {WAYS.map((way) => (
              <motion.li key={way.label} className="contact__way" variants={rise}>
                <span className="contact__label">{way.label}</span>
                <a
                  className="contact__value"
                  href={way.href}
                  {...(way.away ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                >
                  {way.shown}
                </a>
              </motion.li>
            ))}
          </ul>

          <motion.div className="contact__note" variants={rise}>
            <span className="contact__label">One more thing</span>
            <p>
              You don&rsquo;t need a perfectly formed idea before reaching out. Sometimes the best
              projects begin with{' '}
              {/* Non-breaking throughout, so the quotation travels as one word
                  and lands whole on the last line. It was splitting after the
                  "I", which leaves a line ending on a lone pronoun and the
                  point of the sentence orphaned below it. */}
              <em>&ldquo;I&nbsp;have&nbsp;an&nbsp;idea&hellip;&rdquo;</em>
            </p>
          </motion.div>
        </div>
      </motion.div>

    </section>
  )
}
