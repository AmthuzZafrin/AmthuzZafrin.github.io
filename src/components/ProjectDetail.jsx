import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import BubuStage from './BubuStage.jsx'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import './ProjectDetail.css'

/**
 * A project's own page, opened from its button on the work section.
 *
 * It is fixed to the viewport rather than a section in the scroll track: the
 * track is a snap container of one page per viewport, and a detail page that
 * only exists once you have asked for it does not belong in that sequence.
 * Escape and the back control both close it.
 */
export default function ProjectDetail({ project, onClose }) {
  const reduced = usePrefersReducedMotion()
  const backRef = useRef(null)

  // Focus moves into the page that just opened, so the keyboard follows the
  // eye. On mount only: onClose is a fresh closure every render, so tying this
  // to it would pull focus back here on every keystroke.
  useEffect(() => {
    backRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const page = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 26 },
    shown: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduced ? 0.3 : 0.5,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: reduced ? 0 : 0.07,
        delayChildren: reduced ? 0 : 0.1,
      },
    },
    gone: {
      opacity: 0,
      y: reduced ? 0 : 18,
      transition: { duration: reduced ? 0.2 : 0.3, ease: [0.4, 0, 1, 1] },
    },
  }

  const rise = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 16 },
    shown: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0.3 : 0.5, ease: [0.22, 1, 0.36, 1] },
    },
    gone: { opacity: 0 },
  }

  return (
    <motion.div
      className={`detail is-${project.id}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${project.name} — project detail`}
      variants={page}
      initial="hidden"
      animate="shown"
      exit="gone"
    >
      <motion.button
        type="button"
        className="detail__back"
        onClick={onClose}
        ref={backRef}
        variants={rise}
      >
        <span aria-hidden="true">←</span> The Gen AI work
      </motion.button>

      <div className="detail__body">
        <motion.h2 className="section-title detail__title" variants={rise}>
          {project.name}
        </motion.h2>

        {project.tagline && (
          <motion.p className="section-sub detail__sub" variants={rise}>
            {project.tagline}
          </motion.p>
        )}

        <div className="detail__grid">
          {/* The plate belongs to the recording. With the faces in it there is
              nothing to frame — see .is-bare. */}
          <motion.figure
            className={`detail__media${!project.video && project.reel ? ' is-bare' : ''}`}
            style={project.ratio ? { '--ratio': project.ratio } : undefined}
            variants={rise}
          >
            {project.video ? (
              <video
                src={project.video}
                poster={project.poster}
                controls
                playsInline
                preload="metadata"
              />
            ) : project.face && !reduced ? (
              <BubuStage size={FACE_SIZE} />
            ) : project.reel ? (
              /* Stills, for a viewer who asked for no motion: the renderer
                 breathes and blinks whatever it is told to show, and there is
                 no telling it not to. */
              <Reel faces={project.reel} dir={project.id} name={project.name} />
            ) : (
              /* The frame is held at the video's own proportions so the page
                 does not change shape when the recording lands. */
              <div className="detail__pending">Demo video to come</div>
            )}
          </motion.figure>

          <motion.div className="detail__copy" variants={rise}>
            {/* Two shapes of account, and a project uses one or the other: a
                few paragraphs of prose, or a line and the four things that
                line is made of. */}
            {project.lead && <p className="detail__lead">{project.lead}</p>}

            {project.points && (
              <ul className="detail__points">
                {project.points.map(([label, text]) => (
                  <li key={label} className="detail__point">
                    <b className="detail__point-label">{label}</b>
                    {text}
                  </li>
                ))}
              </ul>
            )}

            {project.body?.map((para) => (
              <p key={para.slice(0, 24)} className="detail__para">
                {para}
              </p>
            ))}

            {/* Only where there is one to give. BUBU has no public repository,
                and an empty slot would read as a broken link rather than as
                an absent one. */}
            {project.repo && (
              <p className="detail__links">
                <a
                  className="detail__repo"
                  href={project.repo}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Source on GitHub
                </a>
              </p>
            )}

            {project.meta && <p className="detail__meta">{project.meta}</p>}
            {project.note && <p className="detail__note">{project.note}</p>}
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

/** How long a face is held before the next one comes up. */
const HOLD = 3200

/** The face's own size, matching what the product's page shows it at. */
const FACE_SIZE = 'min(60vh, 30rem)'

/**
 * The demo frame with no recording in it yet: the product's own faces, run one
 * after another the way the app runs them. Every one is in the document from
 * the start and they cross-fade on opacity, so there is nothing to load
 * mid-cycle and nothing reflows as it turns over.
 *
 * It is the whole set read in order, not a sample, so it is labelled as one
 * picture rather than as fourteen — a screen reader is told what is there, not
 * given the same alt text over and over as the timer fires.
 */
function Reel({ faces, dir, name }) {
  const reduced = usePrefersReducedMotion()
  const [at, setAt] = useState(0)

  useEffect(() => {
    // Still, if the viewer asked for stillness. The first face stands on its
    // own and the frame says the same thing it would have said moving.
    if (reduced) return
    const id = setInterval(() => setAt((i) => (i + 1) % faces.length), HOLD)
    return () => clearInterval(id)
  }, [faces.length, reduced])

  return (
    <div
      className="detail__reel"
      role="img"
      aria-label={`${name} cycling through its ${faces.length} expressions`}
    >
      {faces.map((face, i) => (
        <img
          key={face.slug}
          className={`detail__face${i === at ? ' is-at' : ''}`}
          src={`/${dir}/${face.slug}.webp`}
          alt=""
          decoding="async"
          draggable="false"
        />
      ))}
    </div>
  )
}
