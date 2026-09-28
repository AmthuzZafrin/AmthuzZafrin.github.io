import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useInView } from '../hooks/useInView.js'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import './Skills.css'

/**
 * In the order they were given, which is the order they were learned in and
 * groups them without having to label the groups: the languages and what they
 * are built with, then the machine-learning libraries, then the ideas those
 * libraries serve, then what serves a model to a user, then the bench.
 *
 * Casing is each project's own — JavaScript, PyTorch, scikit's hyphen — because
 * a toolkit page that spells its tools wrong is the one thing on it a reader
 * can check.
 */
const SKILLS = [
  'Python',
  'Java',
  'HTML',
  'CSS',
  'JavaScript',
  'React',
  'Vite',
  'Capacitor',
  'Gradle',

  'LangChain',
  'Hugging Face',
  'OpenCV',
  'MediaPipe',
  'TensorFlow',
  'PyTorch',
  'Keras',
  'Scikit-learn',

  'Affective Computing',
  'LLM',
  'Prompt Engineering',
  'RAG',
  'Computer Vision',
  'NLP',
  'Neural Networks',

  'Flask',
  'Streamlit',
  'FastAPI',

  'GitHub',
  'VS Code',
]

/**
 * ---- how the cluster holds together ----
 *
 * Every bubble is pulled toward the middle and pushed off whatever it is
 * touching, and the two settle against each other into a packed drift. The
 * pull is measured against the field's own half-width and half-height rather
 * than in pixels, so the cluster takes the shape of the space it is given — a
 * wide ellipse on a laptop, closer to a disc on a narrow window.
 */
const PULL = 0.55
/** Air between two bubbles that are touching. */
const GAP = 10
/**
 * How much of an overlap is undone per frame, shared between the pair.
 *
 * Stiff, and it has to be: at this size the pack sits at about three quarters
 * of the field and a softer push let the wander squeeze bubbles eight pixels
 * into each other — which is nothing on a tag and wrong on a bubble, because
 * two real ones share a wall rather than passing through one another. Stiffer
 * still and the whole field rings: past about 0.8 the repulsion overshoots,
 * the overshoot is pushed back, and peak speeds go from four pixels a frame to
 * fifteen.
 */
const PUSH = 0.7
/** What is left of a bubble's speed after a frame. Low: this is a drift. */
const DAMP = 0.9
/** The breath. Without it the cluster solves itself and then stands still.
    At this strength a bubble wanders some seventy pixels from where it settled
    over a quarter of a minute — a drift you can watch rather than one you have
    to be told about, and still slow enough that nothing darts. Past about this
    the pack absorbs the extra and the excursions stop growing. */
const WANDER = 0.03
/** Enough steps for the opening spiral to settle before it is first painted. */
const SETTLE = 260

/* ---- and how it gets out of the way ----
 *
 * The pointer is another thing to be pushed off, with two differences: it is
 * far stronger than a bubble, and while it is in among them the cluster is let
 * off most of its pull toward the middle and given a little more room than the
 * field.
 *
 * That last part is the whole trick. A pack at three quarters of its field has
 * nowhere to put a hole: shoving one bubble aside means shoving the chain
 * behind it, and every bubble in that chain is held by the same pull. Pushing
 * hard enough to win squeezed bubbles four pixels into each other and still
 * opened almost nothing. Loosen the pull and lift the wall by eight percent
 * and the same shove opens sixty pixels of clear space with no overlap at all,
 * because now there is somewhere for the displaced ones to go.
 */
const REACH = 200
const SHOVE = 1.6
/** What is left of the pull toward the middle while the pointer is in among them. */
const EASE = 0.25
/** And how much further than the field they may spread while it is. */
const ROOM = 1.08
/** How quickly the cluster loosens and gathers again. */
const OPENING = 0.12

const GOLDEN = Math.PI * (3 - Math.sqrt(5))

/**
 * One step of the whole field. Written as a plain function over an array of
 * bubbles so the still version and the moving one run the same physics: under
 * prefers-reduced-motion this is called a few hundred times in a row and the
 * result painted once, and otherwise it is called on every frame.
 */
function step(bubbles, halfW, halfH, t, pointer) {
  // Is it in among them, or merely somewhere over the field? A cursor resting
  // in a corner the cluster does not reach should not loosen it.
  let among = false
  if (pointer.live) {
    for (const b of bubbles) {
      if (Math.hypot(b.x - pointer.x, b.y - pointer.y) < REACH + b.r) {
        among = true
        break
      }
    }
  }

  // Eased in and out rather than switched, so the cluster opens and gathers
  // instead of flinching.
  pointer.open += ((among ? 1 : 0) - pointer.open) * OPENING
  const pull = PULL * (1 - pointer.open * (1 - EASE))
  const room = 1 + pointer.open * (ROOM - 1)

  for (const b of bubbles) {
    // Toward the middle, against the field's own half-axes rather than in
    // pixels: a bubble at the top of the field is pulled as hard as one at the
    // side, so the cluster settles into the shape of the space it is given
    // instead of into a disc in the middle of it.
    b.vx += -(b.x / halfW) * pull
    b.vy += -(b.y / halfH) * pull
    // And a slow wander that never repeats exactly: the two frequencies are
    // irrational multiples of each other, so the path a bubble takes is a
    // Lissajous figure that does not close.
    b.vx += Math.cos(t * b.wx + b.phase) * WANDER
    b.vy += Math.sin(t * b.wy + b.phase) * WANDER

    // Off the pointer, at full strength the moment it arrives — the loosening
    // is eased, the getting out of the way is not. Squared falloff: barely
    // felt at arm's length, firm up close.
    if (!pointer.live) continue
    const dx = b.x - pointer.x
    const dy = b.y - pointer.y
    const gap = Math.hypot(dx, dy) || 0.01
    const reach = REACH + b.r
    if (gap >= reach) continue
    const fall = 1 - gap / reach
    const shove = fall * fall * SHOVE
    b.vx += (dx / gap) * shove
    b.vy += (dy / gap) * shove
  }

  // Off each other. Twenty-nine bubbles is four hundred pairs, which is
  // nothing — a quadtree here would be more code than the whole section.
  for (let i = 0; i < bubbles.length; i += 1) {
    const a = bubbles[i]
    for (let j = i + 1; j < bubbles.length; j += 1) {
      const b = bubbles[j]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const least = a.r + b.r + GAP
      const dist = Math.hypot(dx, dy) || 0.01
      if (dist >= least) continue
      const shove = ((least - dist) / dist) * PUSH * 0.5
      a.vx -= dx * shove
      a.vy -= dy * shove
      b.vx += dx * shove
      b.vy += dy * shove
    }
  }

  for (const b of bubbles) {
    b.vx *= DAMP
    b.vy *= DAMP
    b.x += b.vx
    b.y += b.vy

    // The wall, as a position rather than a force. The pull alone settles
    // wherever it happens to balance the pushing, and that balance moves with
    // the window; this is what guarantees nothing is ever outside the field,
    // whatever size the window is or how hard the cluster is breathing.
    //
    // A squircle rather than an ellipse — the same expression with the squares
    // raised to a cube. An ellipse inscribed in the field leaves its four
    // corners empty, which is a fifth of the room this section has; letting the
    // pack reach into them is what paid for the bubbles being a fifth larger
    // without a single one of them overlapping another.
    const reachX = Math.max(halfW * room - b.r, 1)
    const reachY = Math.max(halfH * room - b.r, 1)
    const out = Math.cbrt(Math.abs((b.x / reachX) ** 3) + Math.abs((b.y / reachY) ** 3))
    if (out > 1) {
      b.x /= out
      b.y /= out
      b.vx *= 0.4
      b.vy *= 0.4
    }
  }
}

export default function Skills() {
  const [ref, inView] = useInView({ threshold: 0.25 })
  const reduced = usePrefersReducedMotion()
  const fieldRef = useRef(null)
  const slots = useRef([])

  useEffect(() => {
    const field = fieldRef.current
    const nodes = slots.current.filter(Boolean)
    if (!field || nodes.length === 0) return undefined

    const halfW = field.clientWidth / 2
    const halfH = field.clientHeight / 2

    // The opening arrangement is a phyllotaxis spiral — the sunflower's — so
    // the bubbles start evenly spread and roughly round, and the relaxation
    // has a packing to tidy rather than a pile to untangle.
    const bubbles = nodes.map((el, i) => {
      const spread = Math.sqrt((i + 0.5) / nodes.length)
      return {
        el,
        r: el.offsetWidth / 2,
        x: Math.cos(GOLDEN * i) * spread * halfW * 0.78,
        y: Math.sin(GOLDEN * i) * spread * halfH * 0.78,
        vx: 0,
        vy: 0,
        phase: (i * 2.399963) % (Math.PI * 2),
        wx: 0.00042 + (i % 5) * 0.00008,
        wy: 0.00037 + (i % 7) * 0.00007,
      }
    })

    // Where the cursor is, in the same coordinates the bubbles use: an offset
    // from the middle of the field. `open` is how far the cluster has loosened
    // for it, and lives here so it survives between frames.
    const pointer = { x: 0, y: 0, live: false, open: 0 }

    const paint = () => {
      for (const b of bubbles) {
        b.el.style.transform = `translate3d(${(b.x - b.r).toFixed(2)}px, ${(b.y - b.r).toFixed(2)}px, 0)`
      }
    }

    // Settled before anyone sees it, so the section opens on a packed cluster
    // rather than on a spiral pulling itself in.
    for (let i = 0; i < SETTLE; i += 1) step(bubbles, halfW, halfH, i * 16, pointer)
    paint()

    // Still for anyone who asked for still, and that includes the cursor: a
    // cluster that parts when you move the mouse is motion whoever started it.
    if (reduced) return undefined

    let frame = 0
    let running = false
    const tick = (now) => {
      step(bubbles, halfW, halfH, now, pointer)
      paint()
      frame = requestAnimationFrame(tick)
    }
    const start = () => {
      if (running) return
      running = true
      frame = requestAnimationFrame(tick)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(frame)
    }

    // It only drifts while it is being looked at. A field of twenty-nine
    // elements re-transformed sixty times a second is cheap, and it is still
    // not worth spending on a section three pages up the track.
    const watch = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting && !document.hidden ? start() : stop()),
      { threshold: 0.08 }
    )
    watch.observe(field)

    const onVisibility = () => (document.hidden ? stop() : undefined)
    document.addEventListener('visibilitychange', onVisibility)

    // Listened for on the field rather than on the bubbles, because the bubbles
    // are about to move out from under the cursor — a pointer that only fires
    // while it is over one would lose track the moment it worked.
    const onMove = (e) => {
      const box = field.getBoundingClientRect()
      pointer.x = e.clientX - (box.left + box.width / 2)
      pointer.y = e.clientY - (box.top + box.height / 2)
      pointer.live = true
    }
    const onOut = () => {
      pointer.live = false
    }
    field.addEventListener('pointermove', onMove)
    field.addEventListener('pointerleave', onOut)
    field.addEventListener('pointercancel', onOut)

    return () => {
      stop()
      watch.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      field.removeEventListener('pointermove', onMove)
      field.removeEventListener('pointerleave', onOut)
      field.removeEventListener('pointercancel', onOut)
    }
  }, [reduced])

  const rise = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 18 },
    shown: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0.4 : 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  }

  const field = {
    hidden: { opacity: 0 },
    shown: {
      opacity: 1,
      transition: {
        duration: reduced ? 0.4 : 0.5,
        staggerChildren: reduced ? 0 : 0.028,
        delayChildren: reduced ? 0 : 0.12,
      },
    },
  }

  const pop = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, scale: 0.5 },
    shown: {
      opacity: 1,
      scale: 1,
      transition: { duration: reduced ? 0.35 : 0.5, ease: [0.34, 1.45, 0.64, 1] },
    },
  }

  return (
    <section id="skills" className="section section--center" ref={ref}>
      <motion.h2
        className="section-title skills__title"
        variants={rise}
        initial="hidden"
        animate={inView ? 'shown' : 'hidden'}
      >
        The Toolkit
      </motion.h2>

      <motion.p
        className="section-sub"
        variants={rise}
        initial="hidden"
        animate={inView ? 'shown' : 'hidden'}
      >
        Twenty-nine of them, and everything on this site was built with these.
      </motion.p>

      {/* A list, because that is what it is. The positions are the physics
          above; nothing here says where anything goes. */}
      <motion.ul
        className="skills__field"
        ref={fieldRef}
        variants={field}
        initial="hidden"
        animate={inView ? 'shown' : 'hidden'}
      >
        {SKILLS.map((name, i) => (
          <li
            key={name}
            className="skills__slot"
            ref={(el) => {
              slots.current[i] = el
            }}
          >
            {/* The glass is its own element so the hover can scale it: the
                slot's transform belongs to the simulation, and a second one
                written from CSS would be the last one to land. */}
            <motion.span
              className="skills__bubble"
              variants={pop}
              // Where this one's interference colours start. 137 degrees a step
              // is the golden angle in a circle, so twenty-nine of them come
              // out spread rather than in bands of the same few.
              style={{ '--spin': `${(i * 137) % 360}deg` }}
            >
              <span className="skills__word">{name}</span>
            </motion.span>
          </li>
        ))}
      </motion.ul>
    </section>
  )
}
