import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useZoom } from '../components/Zoom.jsx'
import { useInView } from '../hooks/useInView.js'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import './Experience.css'

/**
 * Give a tag a `title` and a `cert` and it shows them on the right when it is
 * picked up; without them it just prints its label. The geometry reads the
 * array's length, so adding or removing a tag re-spaces the fan on its own.
 *
 * `tint` is the heading's own gradient, sampled off that certificate — the
 * light gold and plum of the Infotact sheet, Unified Mentor's navy, and so on —
 * so the title on the right belongs to the paper under it rather than every
 * one of them sharing a single indigo.
 */
const TAGS = [
  {
    id: 't1',
    label: 'BICS GLOBAL',
    meta: '2025',
    shape: 'motel',
    tone: 'frost',
    title: 'Data Science Intern in BICS GLOBAL',
    cert: '/certs/data-science-bics.webp',
    certAlt:
      'Internship completion letter from BICS GLOBAL, Chennai — Data Science internship, July to August 2025',
    // the green and blue of the BICS mark
    tint: { hi: '#cdeecb', low: '#3f9a5c', glow: '110 190 130' },
  },
  {
    id: 't2',
    label: 'Infotact Solutions',
    meta: '2025',
    shape: 'bar',
    tone: 'smoke',
    title: 'Data Science and Machine Learning Intern in Infotact Solution',
    cert: '/certs/data-science-ml-infotact.webp',
    certAlt:
      'Certificate of internship from Infotact Solutions — Data Science & ML, May to October 2025',
    // the gold ribbon off the plum ground
    tint: { hi: '#f6e6bb', low: '#c08f38', glow: '224 186 110' },
  },
  {
    id: 't3',
    label: 'Unified Mentor',
    meta: '2025',
    shape: 'bar',
    tone: 'accent',
    title: 'Data Science Intern in Unified Mentor',
    cert: '/certs/data-science-unified-mentor.webp',
    certAlt:
      'Certificate of internship from Unified Mentor Pvt Ltd — Machine Learning Intern, July to September 2025',
    // Unified Mentor's navy, lifted enough to carry on black
    tint: { hi: '#bcd0f5', low: '#3f5da8', glow: '130 160 230' },
  },
  {
    id: 't4',
    label: 'knowledge xchange',
    meta: 'KXC · 2022',
    shape: 'motel',
    tone: 'steel',
    title: 'Advanced Python Intern in Knowledge Xchange',
    cert: '/certs/advanced-python-kxc.webp',
    certAlt:
      'Certificate of internship completion — 30-day Advanced Python internship, Knowledge Xchange, May to June 2022',
    // the orange corner flashes on the Knowledge Xchange sheet
    tint: { hi: '#ffd9b3', low: '#d1691f', glow: '226 140 70' },
  },
]

/** How far apart the tags would hang, and how hard they shove when one is up. */
const SPREAD = 19
const SHOVE = 17

/**
 * The tag in hand when you arrive. The section opens on a certificate rather
 * than on an empty column: an idle keyring says nothing about the work, and
 * there is no reading of "hover a tag" that tells you what you would get.
 * The last of them, so the three others fan out toward the heading and the
 * bunch leans away from the sheet it is showing.
 */
const OPENS_ON = TAGS.length - 1

/**
 * The tags hang off one ring, so every one of them is described by an angle
 * about that ring rather than by a position. Picking one up means: bring it to
 * the middle, face it at the viewer, pull it forward — and push everything on
 * its left further left and everything on its right further right, by an
 * amount that falls off with distance so the far tags barely stir.
 */
function poseFor(i, held, count) {
  // Negative swings a hanging element's foot to the right, so the sign is
  // flipped to put the first tag on the left where reading order expects it.
  const rest = ((count - 1) / 2 - i) * SPREAD

  if (held === i) return { a: 0, ry: 0, z: 150, lift: 1 }

  const away = held - i
  const falloff = 1 / Math.abs(away)
  return {
    a: rest + Math.sign(away) * SHOVE * (0.55 + 0.45 * falloff),
    ry: rest * 0.26,
    z: -30 - Math.abs(away) * 10,
    lift: 0,
  }
}

export default function Experience() {
  const [ref, inView] = useInView({ threshold: 0.3 })
  const zoom = useZoom()
  const reduced = usePrefersReducedMotion()
  const [held, setHeld] = useState(OPENS_ON)

  const shown = TAGS[held]

  const rise = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 18 },
    shown: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0.4 : 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  }

  const drop = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: -40 },
    shown: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0.4 : 0.8, ease: [0.24, 1.2, 0.4, 1], delay: 0.1 },
    },
  }

  return (
    <section id="experience" className="section section--center" ref={ref}>
      <div className="exp__stage">
        {/* Top left, out of the certificate's way — there is one up from the
            moment you arrive, so the heading no longer has a centred position
            to slide out of. The two of them travel as one block: the stage is
            a grid, and a heading and its caption laid out as separate items
            would be placed separately. */}
        <div className="exp__head">
          <motion.h2
            className="section-title exp__title"
            variants={rise}
            initial="hidden"
            animate={inView ? 'shown' : 'hidden'}
          >
            The Journey
          </motion.h2>

          <motion.p
            className="section-sub exp__sub"
            variants={rise}
            initial="hidden"
            animate={inView ? 'shown' : 'hidden'}
          >
            Four internships, and the certificate each one ended with.
          </motion.p>
        </div>

      <motion.div
        className="exp__rig is-held"
        variants={drop}
        initial="hidden"
        animate={inView ? 'shown' : 'hidden'}
      >
        <Clasp />

        <div className="exp__fan">
          {TAGS.map((tag, i) => {
            const { a, ry, z, lift } = poseFor(i, held, TAGS.length)
            return (
              <button
                type="button"
                key={tag.id}
                className={`exp__tag is-${tag.shape} is-${tag.tone}${lift ? ' is-up' : ''}`}
                style={{
                  '--a': `${a}deg`,
                  '--ry': `${ry}deg`,
                  '--z': `${z}px`,
                  // Whichever tag is up has to paint over the others, and the
                  // rest stack back from it.
                  zIndex: lift ? TAGS.length + 1 : TAGS.length - Math.abs(i - held),
                }}
                onMouseEnter={() => setHeld(i)}
                onFocus={() => setHeld(i)}
                onClick={() => setHeld(i)}
                aria-label={`${tag.label} — ${tag.meta}`}
              >
                <span className="exp__wire" aria-hidden="true" />
                <span className="exp__body">
                  {/* The slab. Sits a few millimetres behind the face in real
                      depth, so turning the tag shows its thickness instead of
                      revealing that it was a rectangle all along. */}
                  <span className="exp__edge" aria-hidden="true" />
                  <span className="exp__face">
                    <span className="exp__hole" aria-hidden="true">
                      <span className="exp__grommet" />
                    </span>
                    <span className="exp__label">{tag.label}</span>
                    <span className="exp__meta">{tag.meta}</span>
                  </span>
                  {/* Dimming is an overlay, not a filter: a filter would
                      flatten the slab back into the face. */}
                  <span className="exp__shade" aria-hidden="true" />
                </span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Under the bunch it is talking about, rather than under the heading:
          there is always a tag up now, so the line is no longer the caption of
          an empty column — it is the label on the control. */}
      <motion.p
        className="exp__hint"
        variants={rise}
        initial="hidden"
        animate={inView ? 'shown' : 'hidden'}
      >
        Hover a tag
      </motion.p>

      {/* Whatever is in hand, read out beside the ring. */}
      <div className="exp__detail">
        <AnimatePresence>
          {shown.cert && (
            <motion.figure
              key={shown.id}
              className="exp__cert"
              style={{
                '--ct-hi': shown.tint.hi,
                '--ct-low': shown.tint.low,
                '--ct-glow': shown.tint.glow,
              }}
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: 26 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, x: -14 }}
              transition={{ duration: reduced ? 0.25 : 0.42, ease: [0.22, 1, 0.36, 1] }}
            >
              <figcaption className="exp__cert-title">{shown.title}</figcaption>
              <img {...zoom({ src: shown.cert, alt: shown.certAlt, name: shown.title })} />
            </motion.figure>
          )}
        </AnimatePresence>
      </div>
      </div>
    </section>
  )
}

/** The carabiner and split ring the whole bunch hangs from. */
function Clasp() {
  return (
    <svg className="exp__clasp" viewBox="0 0 120 168" aria-hidden="true">
      <defs>
        {/*
          Chrome is not a grey gradient. Polished metal mirrors its
          surroundings: bright sky above, dark ground below, meeting in a hard
          line. That horizon — the abrupt jump at 50% — is what reads as metal;
          a smooth light-to-dark ramp reads as grey plastic, which is what the
          first version of this looked like.
        */}
        <linearGradient id="exp-chrome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4f6fb" />
          <stop offset="26%" stopColor="#ccd2df" />
          <stop offset="46%" stopColor="#959cad" />
          <stop offset="50%" stopColor="#21242c" />
          <stop offset="55%" stopColor="#7c8393" />
          <stop offset="74%" stopColor="#d2d8e5" />
          <stop offset="100%" stopColor="#6a7180" />
        </linearGradient>

        {/* A rod, lit from the upper left: dark rim, hot specular, falloff,
            then a weaker bounce off the far side. */}
        <linearGradient id="exp-rod" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#33384333" />
          <stop offset="4%" stopColor="#333843" />
          <stop offset="16%" stopColor="#b8bfce" />
          <stop offset="29%" stopColor="#f8fafd" />
          <stop offset="44%" stopColor="#cbd1de" />
          <stop offset="63%" stopColor="#767d8d" />
          <stop offset="84%" stopColor="#c0c7d5" />
          <stop offset="96%" stopColor="#3a3f4c" />
          <stop offset="100%" stopColor="#3a3f4c33" />
        </linearGradient>

        <radialGradient id="exp-rivet" cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#a8afbe" />
          <stop offset="100%" stopColor="#2b2f39" />
        </radialGradient>
      </defs>

      {/* ---- the shackle ---- */}
      <path
        d="M41 66 V38 a19 19 0 0 1 38 0 V66"
        fill="none"
        stroke="#14161c"
        strokeWidth="13.5"
        strokeLinecap="round"
      />
      <path
        d="M41 66 V38 a19 19 0 0 1 38 0 V66"
        fill="none"
        stroke="url(#exp-rod)"
        strokeWidth="11"
        strokeLinecap="round"
      />
      {/* the highlight that runs along the top of the bend */}
      <path
        d="M45 52 V39 a15 15 0 0 1 30 0 V52"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* ---- the body ---- */}
      <rect x="33" y="63" width="54" height="29" rx="7" fill="#0f1116" />
      <rect x="34" y="64" width="52" height="27" rx="6" fill="url(#exp-chrome)" />
      {/* the gate's seam */}
      <path d="M60 64 V91" stroke="#151820" strokeWidth="1" opacity="0.55" />
      {/* the catch */}
      <circle cx="46" cy="77.5" r="5" fill="url(#exp-rivet)" />
      <circle cx="46" cy="77.5" r="5" fill="none" stroke="#14161c" strokeWidth="1.2" />
      <rect x="34" y="64" width="52" height="27" rx="6" fill="none" stroke="#191c24" strokeWidth="1.2" />

      {/* ---- the swivel ---- */}
      <rect x="52.5" y="91" width="15" height="13" rx="3.5" fill="#12141a" />
      <rect x="53.5" y="91.5" width="13" height="11.5" rx="3" fill="url(#exp-chrome)" />

      {/*
        ---- the split ring ----
        Two turns of one wire. The second turn is placed with a dash rather than
        drawn as an arc: pathLength="100" makes the dash units percentages of
        the way round, so "25 75" at offset -25 is exactly the quarter from the
        bottom to the left side. Hand-written arc sweeps for this crossed
        through the middle of the ring and read as an X.
      */}
      <ellipse cx="60" cy="122" rx="22" ry="15.5" fill="none" stroke="#0d0f14" strokeWidth="7.4" />
      <ellipse cx="60" cy="122" rx="22" ry="15.5" fill="none" stroke="url(#exp-rod)" strokeWidth="5.2" />

      {/* the second turn, riding just inside the first over one quarter */}
      <ellipse
        cx="60"
        cy="124.4"
        rx="21"
        ry="14.5"
        fill="none"
        stroke="url(#exp-rod)"
        strokeWidth="4.4"
        strokeLinecap="round"
        pathLength="100"
        strokeDasharray="26 74"
        strokeDashoffset="-24"
      />

      {/* where the two ends part */}
      <ellipse
        cx="60"
        cy="122"
        rx="22"
        ry="15.5"
        fill="none"
        stroke="#07080b"
        strokeWidth="7.6"
        pathLength="100"
        strokeDasharray="4 96"
        strokeDashoffset="-73"
      />

      {/* the specular skid along the ring's upper left */}
      <ellipse
        cx="60"
        cy="122"
        rx="22"
        ry="15.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.6"
        pathLength="100"
        strokeDasharray="14 86"
        strokeDashoffset="-56"
      />
    </svg>
  )
}
