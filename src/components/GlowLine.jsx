import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import './GlowLine.css'

/**
 * Smooth curve through every point (Catmull-Rom converted to cubic beziers).
 * The user's reference is drawn freehand; running it through this smooths the
 * shake out of it while keeping the shape they drew.
 */
function catmullRom(pts) {
  let d = ''
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    d +=
      ` C ${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6},` +
      ` ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6},` +
      ` ${p2[0]} ${p2[1]}`
  }
  return d
}

// Traced from the user's drawing. x spans the section; y is in the drawing's
// own units and gets remapped into BAND_TOP..BAND_BOTTOM below.
//
// It runs in at the left edge, descends to a crossing, ties a teardrop loop
// hanging below it, then heads right through one deep valley, lifts to a
// crest, and eases off the right edge.
const SKETCH = [
  [0.0, 0.104], // touches the left edge
  [0.055, 0.128],
  [0.112, 0.176],
  [0.165, 0.245],
  [0.212, 0.33],
  [0.252, 0.428],
  [0.278, 0.512],
  [0.292, 0.577], // the crossing
  [0.305, 0.652], // down the loop's right flank
  [0.311, 0.722],
  [0.308, 0.792],
  [0.295, 0.86],
  [0.27, 0.917],
  [0.228, 0.958],
  [0.182, 0.979], // bottom of the loop
  [0.144, 0.979],
  [0.113, 0.945],
  [0.095, 0.877],
  [0.089, 0.793], // widest point on the left
  [0.094, 0.71],
  [0.111, 0.648],
  [0.14, 0.606],
  [0.182, 0.582],
  [0.228, 0.573],
  [0.272, 0.571], // back up to close the loop
  // Right half: deliberately sparse. Tracing every wobble of the freehand
  // stroke here made the curve read as lumpy, so these are the few anchors
  // that carry the shape — the run out, the drop, the valley, the crest.
  [0.322, 0.58], // away from the loop
  [0.43, 0.604],
  [0.53, 0.674], // the descent begins
  [0.62, 0.81],
  [0.712, 0.912], // valley
  [0.8, 0.856],
  [0.89, 0.778], // crest
  [1.01, 0.796], // eases off the right edge
]

// The drawing is remapped into this vertical band of the section, which keeps
// the loop clear of the floor and the entry clear of the ceiling at any
// viewport height.
const BAND_TOP = 0.06
const BAND_BOTTOM = 0.94

const SKETCH_MIN_Y = Math.min(...SKETCH.map((p) => p[1]))
const SKETCH_MAX_Y = Math.max(...SKETCH.map((p) => p[1]))

function buildPath(w, h) {
  const scale = (BAND_BOTTOM - BAND_TOP) / (SKETCH_MAX_Y - SKETCH_MIN_Y)
  const pts = SKETCH.map(([x, y]) => [
    x * w,
    (BAND_TOP + (y - SKETCH_MIN_Y) * scale) * h,
  ])
  return `M ${pts[0][0]} ${pts[0][1]}` + catmullRom(pts)
}

// Widest and softest first, so the tightest, brightest pass paints last. Six
// passes rather than four: light falls off steeply, and describing that needs
// more steps near the core than out in the atmosphere.
const LAYERS = [
  { name: 'atmos', color: '--line-atmos' },
  { name: 'far', color: '--line-far' },
  { name: 'bloom', color: '--line-glow' },
  { name: 'halo', color: '--line-halo' },
  { name: 'edge', color: '--line-halo' },
  { name: 'core', color: '--line-core' },
  { name: 'hot', color: '--line-hot' },
]

export default function GlowLine() {
  const wrapRef = useRef(null)
  const svgRef = useRef(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const reduced = usePrefersReducedMotion()

  useLayoutEffect(() => {
    const section = wrapRef.current?.parentElement
    if (!section) return
    const measure = () => setSize({ w: section.clientWidth, h: section.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(section)
    return () => ro.disconnect()
  }, [])

  /**
   * The ribbon draws itself on arrival, but stays tied to the scroll:
   *
   *   - arriving at the section plays the draw out on its own, whether the
   *     user came down onto it or back up onto it
   *   - leaving erases it from the end, tracking the scroll exactly
   *   - arriving again draws it out again
   *
   * The two halves are asymmetric on purpose. Drawing eases toward its target
   * on a time constant, so landing on the section plays a real animation rather
   * than flicking to full in however long the snap takes. Erasing follows the
   * scroll one-to-one, so scrolling back up feels like pulling the line off
   * rather than triggering a second animation.
   *
   * Dash offsets go straight to the DOM — re-rendering React on every frame
   * would not keep up.
   */
  useEffect(() => {
    const wrap = wrapRef.current
    const svg = svgRef.current
    if (!wrap || !svg) return

    const paths = Array.from(svg.querySelectorAll('path'))

    const apply = (p) => {
      const offset = String(1 - p)
      for (const path of paths) path.style.strokeDashoffset = offset
      wrap.classList.toggle('is-drawn', p > 0.004)
    }

    if (reduced) {
      apply(1)
      return
    }

    const section = wrap.closest('.section')
    const scroller = wrap.closest('.page') || document.scrollingElement

    // How far the ribbon wants to be drawn, measured symmetrically: nothing
    // when the section is a full viewport away in either direction, complete
    // once it has come level. Approaching from below and approaching from
    // above are the same arrival, so both play the draw.
    const target = () => {
      if (!section) return 0
      const { top } = section.getBoundingClientRect()
      return Math.min(1, Math.max(0, 1 - Math.abs(top) / window.innerHeight))
    }

    // Time constant of the draw. Larger is slower; ~340ms reaches full in
    // a little under two seconds.
    const TAU = 340

    let progress = 0
    let raf = 0
    let last = 0

    const frame = (now) => {
      const dt = last ? Math.min(64, now - last) : 16
      last = now
      const want = target()

      if (want < progress) {
        progress = want // erasing tracks the scroll exactly
      } else {
        progress += (want - progress) * (1 - Math.exp(-dt / TAU))
        if (want - progress < 0.0008) progress = want
      }

      apply(progress)

      if (progress !== want) {
        raf = requestAnimationFrame(frame)
      } else {
        raf = 0
        last = 0
      }
    }

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }

    apply(0)
    schedule()
    scroller.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      scroller.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [reduced, size.w, size.h])

  const d = size.w && size.h ? buildPath(size.w, size.h) : null

  return (
    <div
      className={`glowline-wrap${reduced ? ' is-static' : ''}`}
      ref={wrapRef}
      aria-hidden="true"
    >
      {d && (
        <>
          <svg
            className="glowline"
            ref={svgRef}
            width={size.w}
            height={size.h}
            viewBox={`0 0 ${size.w} ${size.h}`}
            fill="none"
          >
            {LAYERS.map(({ name, color }) => (
              <path
                key={name}
                className={`glowline__${name}`}
                d={d}
                stroke={`var(${color})`}
                /* pathLength normalises the geometry to 1, so the dash values
                   never go stale when the path is rebuilt on resize. */
                pathLength="1"
                strokeDasharray="1"
                strokeDashoffset={1}
              />
            ))}
          </svg>
          {/* Dither. Large soft glows band badly on 8-bit displays against
              pure black; a little noise breaks up the steps. */}
          <div className="glowline__grain" />
        </>
      )}
    </div>
  )
}
