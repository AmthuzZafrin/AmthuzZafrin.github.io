import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useZoom } from '../components/Zoom.jsx'
import { useInView } from '../hooks/useInView.js'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import './Education.css'

/**
 * Three stages, newest first, moved through with the arrows either side.
 *
 * Everything on the two school stages is read off the mark certificates
 * themselves — the school's name and town, the board, the group, the medium,
 * the session, and the marks. Nothing is inferred. The college's dates are
 * still TODO: no document I was given states them, and a portfolio is the
 * wrong place to guess.
 *
 * `photo` is the place itself, and every stage that has one shows it: under a
 * heading of its own where that is all there is, and beside the certificate
 * where there is one — in which case the words stand down altogether, because
 * the certificate already states every one of the facts they were printing.
 */
const STAGES = [
  {
    id: 'college',
    kicker: 'College',
    // Two lines over the photograph rather than a column of facts beside it:
    // the place and what was read there, which is the whole of what this stage
    // has to say until there is a degree certificate to stand beside it.
    headline: 'Aalim Muhammed Salegh College of Engineering',
    line: 'B.Tech - Information Technology | CGPA - 8.47',
    photo: '/education/college-campus.webp',
    photoAlt: 'The college by day, its main block behind the lawns and the walk up to the entrance',
  },
  {
    id: 'hsc',
    kicker: 'Higher Secondary',
    when: 'May 2022',
    title: 'Bharathiyar Matriculation',
    sub: 'Higher Secondary School',
    where: 'Guduvancheri, Chengalpattu',
    photo: '/education/hsc-school.webp',
    // This stage prints no words — see `paired` below — so the two pictures
    // carry between them everything the words used to say.
    photoAlt:
      'Bharathiyar Matriculation Higher Secondary School, Guduvancheri, Chengalpattu — the gateway, with the main block standing behind it',
    sheet: '/education/hsc-marksheet.webp',
    sheetAlt:
      'Higher secondary second year mark certificate, May 2022, State Board of School Examinations, Tamil Nadu — 500 of 600, General Education, English medium',
    score: '500',
    outOf: '/ 600',
    note: 'State Board of School Examinations, Tamil Nadu · General Education · English medium',
  },
  {
    id: 'sslc',
    kicker: 'Secondary',
    when: 'July 2020',
    title: 'CeeDeeYes D.A.V. Public School',
    sub: 'Secondary School Examination',
    where: 'Ammapettai, Kanchipuram',
    photo: '/education/sslc-school.webp',
    // Paired, like the stage before it, so the pictures carry the words.
    photoAlt:
      'CeeDeeYes D.A.V. Public School, Ammapettai, Kanchipuram — the gate and the Mrs. D. Chellakani Memorial Block',
    sheet: '/education/sslc-marksheet.webp',
    sheetAlt:
      'Secondary school examination marks statement cum certificate, July 2020, Central Board of Secondary Education — 446 of 500 across the five main subjects, with Information Technology as the additional subject at 84',
    // The board prints each subject and no total, so the figure is the five
    // main subjects added up — 94, 93, 90, 75 and 94. Information Technology
    // is the additional subject and sits outside that count, which is why it
    // is named in the note rather than folded into the number.
    score: '446',
    outOf: '/ 500',
    note: 'Central Board of Secondary Education · Information Technology as the additional subject, scored 84',
  },
]

/**
 * A stage with both a photograph of the place and its certificate shows the
 * two of them and nothing else. The words would be a third thing competing for
 * a frame that now holds two pictures, and every fact they carried is printed
 * on the certificate standing beside them.
 */
const paired = (stage) => Boolean(stage.photo && stage.sheet)

/**
 * The other shape: a photograph under a line or two of its own, for a stage
 * with nothing to hold up yet. Still being read, so there is no certificate.
 */
const titled = (stage) => Boolean(stage.headline)

export default function Education() {
  const [ref, inView] = useInView({ threshold: 0.3 })
  const zoom = useZoom()
  const reduced = usePrefersReducedMotion()
  /* [index, direction] together: the exit animation has to know which way the
     stage that is leaving should go, and a separate state would let the two
     fall out of step mid-transition. */
  const [[at, dir], setAt] = useState([0, 0])

  const stage = STAGES[at]
  const go = (step) => {
    const next = at + step
    if (next >= 0 && next < STAGES.length) setAt([next, step])
  }

  const rise = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 18 },
    shown: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0.4 : 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  }

  /* Custom carries the direction, so a stage always enters from the side the
     arrow points at and leaves towards the other. */
  const slide = {
    enter: (d) => (reduced ? { opacity: 0 } : { opacity: 0, x: d > 0 ? 46 : -46 }),
    at: { opacity: 1, x: 0, transition: { duration: reduced ? 0.35 : 0.52, ease: [0.22, 1, 0.36, 1] } },
    leave: (d) =>
      reduced
        ? { opacity: 0, transition: { duration: 0.3 } }
        : {
            opacity: 0,
            x: d > 0 ? -46 : 46,
            transition: { duration: 0.34, ease: [0.4, 0, 1, 1] },
          },
  }

  return (
    <section id="education" className="section section--center" ref={ref}>
      <motion.h2
        className="section-title edu__title"
        variants={rise}
        initial="hidden"
        animate={inView ? 'shown' : 'hidden'}
      >
        The Foundation
      </motion.h2>

      <motion.p
        className="section-sub"
        variants={rise}
        initial={'hidden'}
        animate={inView ? 'shown' : 'hidden'}
      >
        College, and the two schools before it, with the mark sheets.
      </motion.p>

      <motion.div
        className="edu__stage"
        variants={rise}
        initial="hidden"
        animate={inView ? 'shown' : 'hidden'}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') go(-1)
          if (e.key === 'ArrowRight') go(1)
        }}
      >
        <Arrow side="prev" onClick={() => go(-1)} disabled={at === 0} />

        <div className="edu__frame">
          <AnimatePresence initial={false} custom={dir}>
            <motion.article
              key={stage.id}
              className={`edu__scene${stage.sheet ? ' edu__scene--doc' : ''}${
                paired(stage) ? ' edu__scene--pair' : ''
              }${titled(stage) ? ' edu__scene--titled' : ''}`}
              custom={dir}
              variants={slide}
              initial="enter"
              animate="at"
              exit="leave"
            >
              {titled(stage) && (
                <header className="edu__head">
                  <h3 className="edu__school">{stage.headline}</h3>
                  <p className="edu__course">{stage.line}</p>
                </header>
              )}

              {/* The place, at full strength: under its heading where that is
                  the stage, and beside the certificate where there is one. */}
              {stage.photo && (
                <figure className="edu__shot">
                  <img
                    {...zoom({
                      src: stage.photo,
                      alt: stage.photoAlt,
                      name: stage.headline ?? stage.title,
                    })}
                    decoding="async"
                  />
                </figure>
              )}

              {!paired(stage) && !titled(stage) && (
                <div className="edu__words">
                  {/* The node the rail starts from. */}
                  <span className="edu__node" aria-hidden="true" />
                  <p className="edu__when">
                    {stage.kicker} <span className="edu__dot">·</span> {stage.when}
                  </p>
                  <h3 className="edu__name">
                    {stage.title}
                    <span className="edu__field">{stage.sub}</span>
                  </h3>
                  {stage.place && <p className="edu__place">{stage.place}</p>}
                  {stage.where && <p className="edu__where">{stage.where}</p>}
                  {stage.score && (
                    <p className="edu__score">
                      {stage.score}
                      <span className="edu__outof">{stage.outOf}</span>
                    </p>
                  )}
                  {stage.note && <p className="edu__note">{stage.note}</p>}
                </div>
              )}

              {/* The certificate stands at the full height of the stage — the
                  tallest thing on the page. */}
              {stage.sheet && (
                <figure className="edu__sheet">
                  <img
                    {...zoom({
                      src: stage.sheet,
                      alt: stage.sheetAlt,
                      name: `${stage.kicker} mark sheet`,
                    })}
                    decoding="async"
                  />
                </figure>
              )}
            </motion.article>
          </AnimatePresence>
        </div>

        <Arrow side="next" onClick={() => go(1)} disabled={at === STAGES.length - 1} />
      </motion.div>

      {/* Where you are in the three, and a way to jump straight there. */}
      <div className="edu__pips">
        {STAGES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`edu__pip${i === at ? ' is-at' : ''}`}
            aria-label={s.kicker}
            aria-current={i === at ? 'true' : undefined}
            onClick={() => setAt([i, i > at ? 1 : -1])}
          />
        ))}
      </div>
    </section>
  )
}

function Arrow({ side, onClick, disabled }) {
  return (
    <button
      type="button"
      className={`edu__arrow is-${side}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={side === 'prev' ? 'Previous stage' : 'Next stage'}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d={side === 'prev' ? 'M15 4.5 7.5 12 15 19.5' : 'M9 4.5 16.5 12 9 19.5'}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
