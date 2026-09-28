import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import './Lightbox.css'

/**
 * What the file should be called once it is on somebody's machine.
 *
 * Built from the name rather than from the path: the path is an index into a
 * gallery — `/certs/gallery/18-data-analysis.webp` — and a folder full of
 * numbered slugs tells the person who downloaded them nothing. The extension
 * is kept from the source, since that is what the bytes actually are.
 */
function fileName({ name, src }) {
  const dot = src.lastIndexOf('.')
  const ext = dot > src.lastIndexOf('/') ? src.slice(dot) : ''
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug || 'image'}${ext}`
}

/**
 * One image, as large as the window will take it, over everything else.
 *
 * Fixed rather than a section in the scroll track, for the reason the project
 * page is: the track is a snap container of one page per viewport, and a view
 * that only exists because you asked for it does not belong in that sequence.
 *
 * Escape closes it, so does the background — anything that is not the picture
 * or the bar above it.
 */
export default function Lightbox({ image, onClose }) {
  const reduced = usePrefersReducedMotion()
  const closeRef = useRef(null)

  // Focus goes to the control that gets you out, and comes back to whatever
  // opened this when it closes — otherwise a keyboard is left at the top of
  // the document, several sections away from the picture it was looking at.
  useEffect(() => {
    const from = document.activeElement
    closeRef.current?.focus()
    return () => from?.focus?.()
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const stop = (e) => e.stopPropagation()

  return (
    <motion.div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={image.name}
      onClick={onClose}
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1, transition: { duration: reduced ? 0.2 : 0.32, ease: [0.22, 1, 0.36, 1] } }}
      exit={{ opacity: 0, transition: { duration: reduced ? 0.15 : 0.22 } }}
    >
      <div className="lightbox__bar" onClick={stop}>
        <p className="lightbox__name">{image.name}</p>

        {/* A plain link with `download`, because that is all it takes: every
            one of these is served from this site, so the browser saves the
            file itself rather than navigating to it. */}
        <a className="lightbox__act" href={image.src} download={fileName(image)}>
          Download
        </a>

        <button type="button" className="lightbox__act is-close" ref={closeRef} onClick={onClose}>
          Close <span aria-hidden="true">✕</span>
        </button>
      </div>

      <div className="lightbox__plate" onClick={stop}>
        <img src={image.src} alt={image.alt} />
      </div>
    </motion.div>
  )
}
