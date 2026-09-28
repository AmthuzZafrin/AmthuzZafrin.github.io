import { Suspense, lazy, useEffect, useRef } from 'react'
import { IDLE_SAFE_EXPRESSIONS } from './BubuFace/constants.js'

/**
 * BUBU's own face, as the app draws it.
 *
 * The faces on the work section are stills exported at 168 x 160, which is all a
 * sticker on a panel needs and nothing like enough for a face shown at half the
 * window: at that size they are drawn at nearly three times what they were made
 * for, and it shows. This is the renderer itself instead — the canvas component
 * out of the BUBU app — so the face is drawn at the size it is displayed, at the
 * screen's own pixel density, and it moves: it breathes, it blinks, and each
 * expression brings whatever belongs to it.
 *
 * Loaded on demand. It is some nine thousand lines of renderer, and nobody who
 * never opens this project's page should be made to download it.
 */
const BubuFace = lazy(() => import('./BubuFace/BubuFace.jsx'))

/**
 * How long a face is held before the next begins, the sequencer's own dwell.
 * Well past its 1700ms default: this is a portfolio page rather than a reply in
 * a conversation, and a face that changes as soon as you have registered it
 * reads as a slideshow being clicked through.
 *
 * The change itself is not instant either — the renderer covers every swap with
 * a blink and eases the features across over 720ms — so what you see is one
 * expression becoming another, not one picture replacing it.
 */
const HOLD_MS = 3600

/**
 * Twice the screen's own density, which the renderer caps at 3. The face is the
 * whole page here; it can afford to be drawn properly.
 */
const SUPERSAMPLE = 2

export default function BubuStage({ size }) {
  const face = useRef(null)

  useEffect(() => {
    // The renderer arrives a tick after the page does, so the sequence cannot
    // simply be started on mount: this polls the ref until the lazy component
    // has mounted and filled it.
    let id = 0
    const start = () => {
      if (!face.current) {
        id = window.setTimeout(start, 60)
        return
      }
      // The app's own idle pool, which is the right set for this: the faces
      // BUBU wears unprompted, with everything that would only make sense as a
      // reaction to something you said left out of it.
      face.current.playSequence(IDLE_SAFE_EXPRESSIONS, { loop: true, holdMs: HOLD_MS })
    }
    start()
    return () => window.clearTimeout(id)
  }, [])

  return (
    <div
      className="bubu-stage"
      role="img"
      aria-label={`BUBU cycling through ${IDLE_SAFE_EXPRESSIONS.length} of its expressions`}
      style={{ width: size, height: size }}
    >
      <Suspense fallback={null}>
        <BubuFace ref={face} size={size} supersample={SUPERSAMPLE} />
      </Suspense>
    </div>
  )
}
