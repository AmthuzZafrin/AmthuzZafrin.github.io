import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useZoom } from '../components/Zoom.jsx'
import { useInView } from '../hooks/useInView.js'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import './Certificates.css'

/**
 * In the priority order given. Titles, issuers and dates are read off the
 * certificates themselves — the PDFs carry their text, and the rest were read
 * from the artwork.
 */
const CERTS = [
  { f: '01-swayam', name: 'Generative AI and Large Language Models', by: 'IIM Bangalore · SWAYAM', when: '2026 · scored 92.5%' },
  { f: '02-multi-agent', name: 'Building Multi-Agent Systems', by: 'Microsoft · Coursera', when: 'July 2026' },
  { f: '03-agentic-ai', name: 'Complete Agentic AI Bootcamp with LangGraph and LangChain', by: 'Krish Naik · Udemy', when: 'August 2026 · 45.5 hours' },
  { f: '04-udemy1', name: 'Building Gen AI Apps — 12+ Hands-on Projects with Gemini Pro', by: 'Krish Naik · Udemy', when: 'July 2026 · 16 hours' },
  { f: '05-mldl', name: 'Complete Data Science, Machine Learning, DL and NLP Bootcamp', by: 'Krish Naik · Udemy', when: 'August 2026 · 101.5 hours' },
  { f: '06-dl-keras', name: 'Introduction to Deep Learning & Neural Networks with Keras', by: 'IBM · Coursera', when: 'April 2024' },
  { f: '07-dnn-pytorch', name: 'Deep Neural Networks with PyTorch', by: 'IBM · Coursera', when: 'April 2024' },
  { f: '08-ml-python', name: 'Machine Learning with Python', by: 'IBM · Coursera', when: 'April 2024' },
  { f: '09-tcs-ion', name: 'TCS iON Career Edge — Young Professional', by: 'Tata Consultancy Services', when: 'August 2025' },
  { f: '10-udemy3', name: 'Master Business Writing and Editing', by: 'Grant Hall · Udemy', when: 'August 2026 · 3 hours' },
  { f: '11-udemy4', name: 'Effective Communication in the Workplace', by: 'Lecturio · Udemy', when: 'August 2026 · 3 hours' },
  { f: '12-udemy4b', name: 'The Growth Mindset Blueprint: Confidence, Impact & Success', by: 'Zubin Rashid · Udemy', when: 'August 2026 · 2.5 hours' },
  { f: '13-udemy6', name: 'Teamwork Masterclass — Guide to Team Building & Teamwork', by: 'Salil Dhawan · Udemy', when: 'August 2026 · 4.5 hours' },
  { f: '14-interviewing', name: 'Complete Job Interviewing Skills with Real Life Examples', by: 'Imran Afzal · Udemy', when: 'September 2026 · 3.5 hours' },
  { f: '15-emotional-intelligence', name: 'Emotional Intelligence Training: EI in the Workplace', by: 'Ermin Dedic · Udemy', when: 'September 2026 · 1.5 hours' },
  { f: '16-ai', name: 'Artificial Intelligence Fundamentals', by: 'IBM SkillsBuild', when: 'September 2025' },
  { f: '17-data-science-101', name: 'Data Science 101', by: 'IBM · Cognitive Class', when: 'June 2025' },
  { f: '18-data-analysis', name: 'Data Analysis with Python', by: 'IBM SkillsBuild', when: 'July 2025' },
  { f: '19-data-viz', name: 'Data Visualization with Python', by: 'IBM SkillsBuild', when: 'July 2025' },
]

/** How many cards are drawn either side of the front one. */
const SIDE = 1
/** Wheel distance that counts as one card, and the pause after a step. */
const NOTCH = 42
const COOLDOWN = 260

export default function Certificates() {
  const [ref, inView] = useInView({ threshold: 0.3 })
  const zoom = useZoom()
  const reduced = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const deckRef = useRef(null)
  const indexRef = useRef(0)
  indexRef.current = index


  /**
   * The wheel drives the row only while it has somewhere to go. At either end
   * the event is left alone, so the page scrolls on and you can leave the
   * section by carrying on in the same direction — the alternative traps you.
   *
   * Registered by hand rather than with onWheel: React's synthetic wheel
   * listener is passive, and a passive listener cannot preventDefault.
   */
  useEffect(() => {
    const el = deckRef.current
    if (!el) return

    let travelled = 0
    let until = 0

    const onWheel = (e) => {
      // The row runs sideways, so a sideways gesture drives it as readily as a
      // downward one: whichever axis is moving more is the one being meant.
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      const step = Math.sign(delta)
      if (!step) return

      const next = indexRef.current + step
      if (next < 0 || next >= CERTS.length) {
        travelled = 0
        return
      }

      e.preventDefault()
      const now = performance.now()
      if (now < until) return

      // A trackpad sends a stream of small deltas where a mouse sends one big
      // one, so steps are counted by distance travelled, not by event.
      travelled += delta
      if (Math.abs(travelled) < NOTCH) return

      travelled = 0
      until = now + COOLDOWN
      setIndex(next)
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const rise = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 18 },
    shown: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0.4 : 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  }

  return (
    <section id="certificates" className="section section--center" ref={ref}>
      <motion.h2
        className="section-title certs__title"
        variants={rise}
        initial="hidden"
        animate={inView ? 'shown' : 'hidden'}
      >
        The Receipts
      </motion.h2>

      <motion.p
        className="section-sub"
        variants={rise}
        initial={'hidden'}
        animate={inView ? 'shown' : 'hidden'}
      >
        Nineteen courses, newest first. Scroll across the row.
      </motion.p>

      <motion.div
        className="certs__stage"
        variants={rise}
        initial="hidden"
        animate={inView ? 'shown' : 'hidden'}
      >
        <div className="certs__deck" ref={deckRef}>
          {CERTS.map((cert, i) => {
            const o = i - index
            // Only the front card and its immediate neighbours are drawn;
            // everything else waits one place further along the row rather
            // than being unmounted, so the images stay in the browser's cache
            // between steps and a card slides in from the side it came from.
            const out = Math.abs(o) > SIDE
            return (
              <figure
                key={cert.f}
                className={`certs__card${o === 0 ? ' is-front' : ''}${out ? ' is-out' : ''}`}
                style={{
                  // Place in the row: how far out, and which way.
                  '--a': Math.min(Math.abs(o), SIDE + 1),
                  '--s': Math.sign(o),
                  zIndex: CERTS.length - Math.abs(o),
                }}
                aria-hidden={o === 0 ? undefined : 'true'}
                // The neighbour you can see is the one you are most likely to
                // want; clicking it brings it round. The rail below is the
                // accessible way to the same place, so this is mouse affordance
                // on something already hidden from assistive technology.
                onClick={o === 0 || out ? undefined : () => setIndex(i)}
              >
                <img
                  // The one at the front opens: it is the only one you are
                  // being shown, and on a card this size the small print on a
                  // certificate is exactly what a visitor would want closer.
                  // The ones behind it are steps in the row, not pictures.
                  {...(o === 0
                    ? zoom({
                        src: `/certs/gallery/${cert.f}.webp`,
                        alt: `${cert.name} — ${cert.by}`,
                        name: cert.name,
                      })
                    : { src: `/certs/gallery/${cert.f}.webp`, alt: '' })}
                  // Not lazy: any of the nineteen can be brought to the front
                  // in a single step, and a deferred one shows as an empty
                  // frame when it gets there. The whole set is under a megabyte.
                  decoding="async"
                  draggable="false"
                />
              </figure>
            )
          })}
        </div>

        {/* All that is left beside the certificates themselves, because each
            one already carries its own title, issuer and date: the rail is
            both the readout and the control — it says where you are in the
            set, and each notch jumps straight to one. It is also the only way
            through the set that does not need a pointer or a wheel, so the
            names live on it. */}
        <div className="certs__rail" role="tablist" aria-label="Certificates">
          {CERTS.map((cert, i) => (
            <button
              type="button"
              key={cert.f}
              className={`certs__notch${i === index ? ' is-current' : ''}`}
              role="tab"
              aria-selected={i === index}
              aria-label={`${cert.name} — ${cert.by}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </motion.div>
    </section>
  )
}
