import { createContext, useContext, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Lightbox from './Lightbox.jsx'

const ZoomContext = createContext(null)

/**
 * Makes a picture openable.
 *
 * It returns the props rather than a handler, so a caller spreads one thing
 * onto the image and gets the whole behaviour with it — the click, its
 * keyboard equivalent, the label that says what opening it would give you, and
 * the marker the stylesheet hangs the cursor and the focus ring on:
 *
 *     const zoom = useZoom()
 *     <img {...zoom({ src, alt, name })} decoding="async" />
 *
 * `role="button"` replaces the image role, which is why `alt` is carried on the
 * label as well: what a screen reader needs here is what the thing is and what
 * pressing it does, and the picture itself is unreachable to it either way.
 */
export function useZoom() {
  return useContext(ZoomContext)
}

/**
 * Holds whichever picture is open and draws it over the page.
 *
 * One of these for the whole site rather than one per section: Escape, the
 * backdrop, the focus it borrows and the layer it sits on are all the same
 * wherever the picture came from, and four copies of that is four places for
 * them to drift apart.
 */
export default function ZoomProvider({ children }) {
  const [open, setOpen] = useState(null)

  const zoom = useMemo(
    () => (image) => ({
      src: image.src,
      alt: image.alt,
      'data-zoom': '',
      role: 'button',
      tabIndex: 0,
      'aria-label': `${image.name} — open larger, with a download`,
      onClick: () => setOpen(image),
      onKeyDown: (e) => {
        // Enter and Space, because that is what a button does, and this is
        // standing in for one.
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        setOpen(image)
      },
    }),
    []
  )

  return (
    <ZoomContext.Provider value={zoom}>
      {children}
      <AnimatePresence>
        {open && <Lightbox key={open.src} image={open} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </ZoomContext.Provider>
  )
}
