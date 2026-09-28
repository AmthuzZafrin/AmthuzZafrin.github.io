/**
 * Clearance maths for a project's scattered stickers.
 *
 * Everything here works from boxes measured off the rendered page rather than
 * derived from constants. That matters twice over: a project whose stickers are
 * words has a different width for every one of them, and measuring removes the
 * standing risk that the sizes in the stylesheet and the sizes in this file
 * drift apart — which has silently invalidated these numbers before.
 */

export const FLOAT_FRAC = 0.014 // 1.4cqh, the vertical drift

/** Shortest distance between two boxes; 0 when they overlap. */
export function boxGap(a, b) {
  const dx = Math.max(0, Math.max(a.l - b.r, b.l - a.r))
  const dy = Math.max(0, Math.max(a.t - b.b, b.t - a.b))
  return Math.hypot(dx, dy)
}

/**
 * Read every sticker's swept box out of the DOM, in panel coordinates. The
 * float is charged into the height here, so a clearance computed from these
 * holds at every point in the animation rather than only at rest.
 */
export function measureBoxes(panelEl) {
  const p = panelEl.getBoundingClientRect()
  const f = FLOAT_FRAC * p.height
  return Array.from(panelEl.querySelectorAll('.projects__sticker')).map((node) => {
    // the word or the image, not the wrapper, which for a word is wider than
    // the glyphs it holds
    const inner = node.querySelector('.projects__word, img') || node
    const r = inner.getBoundingClientRect()
    return { l: r.left - p.left, t: r.top - p.top - f, r: r.right - p.left, b: r.bottom - p.top + f }
  })
}

/** The button's box in the same coordinates. */
export function measureButton(panelEl, buttonEl) {
  if (!buttonEl) return null
  const p = panelEl.getBoundingClientRect()
  const r = buttonEl.getBoundingClientRect()
  return { l: r.left - p.left, t: r.top - p.top, r: r.right - p.left, b: r.bottom - p.top }
}

/**
 * Every clearance in the arrangement. `flags` is the set of indices that fall
 * under one of the thresholds, which is what the editor paints red.
 */
export function inspect(boxes, panelW, panelH, button, limits = {}) {
  const { face = 12, edge = 12, btn = 40 } = limits
  const flags = new Set()

  let minFace = Infinity
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const g = boxGap(boxes[i], boxes[j])
      if (g < minFace) minFace = g
      if (g < face) {
        flags.add(i)
        flags.add(j)
      }
    }
  }

  let minEdge = Infinity
  let minBtn = Infinity
  boxes.forEach((b, i) => {
    const e = Math.min(b.l, b.t, panelW - b.r, panelH - b.b)
    if (e < minEdge) minEdge = e
    if (e < edge) flags.add(i)

    if (button) {
      const g = boxGap(b, button)
      if (g < minBtn) minBtn = g
      if (g < btn) flags.add(i)
    }
  })

  return {
    minFace: boxes.length > 1 ? minFace : Infinity,
    minEdge,
    minBtn: button ? minBtn : Infinity,
    flags,
  }
}

/** The array as it should appear in Projects.jsx, plus the panel it was placed against. */
export function toSource(items, panel) {
  const rows = items.map((it) => {
    const ar = it.ar ? `ar: '${it.ar}', ` : ''
    return (
      `  { slug: '${it.slug}', ${ar}alt: '${it.alt}', x: ${it.x.toFixed(1)}, ` +
      `y: ${it.y.toFixed(1)}, s: ${it.s.toFixed(2)}, rot: ${it.rot}, dur: ${it.dur}, ` +
      `delay: ${it.delay} },`
    )
  })
  const head = panel ? `/* panel ${Math.round(panel.w)} x ${Math.round(panel.h)} */\n` : ''
  return `${head}[\n${rows.join('\n')}\n]\n`
}
