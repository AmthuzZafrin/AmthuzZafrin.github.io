import { motion } from 'framer-motion'
import GlowLine from '../components/GlowLine.jsx'
import { useInView } from '../hooks/useInView.js'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import './Summary.css'

const EXAMPLES = [
  'A companion app for people who need someone to talk to at 2am.',
  'A sign language translator so a deaf student in Tamil Nadu can learn in their own language.',
  'An answer engine for people finding their way back to their faith.',
]

export default function Summary() {
  const [ref, inView] = useInView({ threshold: 0.3 })
  const reduced = usePrefersReducedMotion()

  const line = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 18 },
    shown: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0.4 : 0.7, ease: [0.22, 1, 0.36, 1] },
    },
  }

  const box = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 },
    shown: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: reduced ? 0.4 : 0.8,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: reduced ? 0 : 0.1,
        delayChildren: reduced ? 0 : 0.15,
      },
    },
  }

  return (
    <section id="summary" className="section section--center" ref={ref}>
      <GlowLine />

      <motion.h2
        className="section-title summary__title"
        variants={line}
        initial="hidden"
        animate={inView ? 'shown' : 'hidden'}
      >
        The Premise
      </motion.h2>

      <motion.p
        className="section-sub"
        variants={line}
        initial={'hidden'}
        animate={inView ? 'shown' : 'hidden'}
      >
        The short version, before any of the evidence.
      </motion.p>

      <motion.div
        className="glass summary__box"
        variants={box}
        initial="hidden"
        animate={inView ? 'shown' : 'hidden'}
      >
        <motion.h2 className="summary__thesis" variants={line}>
          I build AI products end to end, alone.
        </motion.h2>

        <motion.p className="summary__lede" variants={line}>
          Most of what I ship starts as a problem I can&rsquo;t stop thinking about.
        </motion.p>

        <ul className="summary__examples">
          {EXAMPLES.map((text) => (
            <motion.li key={text} className="summary__example" variants={line}>
              {text}
            </motion.li>
          ))}
        </ul>

        <motion.p className="summary__stakes" variants={line}>
          No team, no funding, no one to hand the hard part to.
        </motion.p>

        <motion.p className="summary__closer" variants={line}>
          I do the model work, the backend, the frontend, the safety testing, and the launch.
        </motion.p>
      </motion.div>
    </section>
  )
}
