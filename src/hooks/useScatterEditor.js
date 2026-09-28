import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { inspect, measureBoxes, measureButton } from '../lib/scatterLayout.js'

/**
 * Drag-to-place mode for a project's scattered stickers.
 *
 * Off unless the URL carries ?edit, so a visitor can never fall into it. Work
 * is kept in localStorage under the project's own key, so each project's
 * arrangement is saved separately and a reload or an HMR update does not throw
 * it away — Reset is the only thing that clears it.
 */
export function useScatterEditor(initial, name) {
  const STORE = `scatter-${name}-layout-v1`
  const SIZE_STORE = `scatter-${name}-panel-v1`

  const [editing] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(location.search).has('edit')
  )

  // Saved work is only ever loaded in edit mode. Outside it the committed
  // layout must win, or a stale entry in someone's browser would quietly
  // override the arrangement the page actually ships with.
  const [items, setItems] = useState(() => {
    if (typeof window === 'undefined' || !editing) return initial
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || 'null')
      // only trust a saved layout that still matches the current cast
      if (Array.isArray(saved) && saved.length === initial.length) {
        const bySlug = new Map(saved.map((it) => [it.slug, it]))
        if (initial.every((it) => bySlug.has(it.slug))) {
          return initial.map((it) => ({ ...it, ...bySlug.get(it.slug) }))
        }
      }
    } catch {
      /* a corrupt entry just means we start from the committed layout */
    }
    return initial
  })

  // null means "whatever the stylesheet says"; a value overrides it live.
  const [size, setSize] = useState(() => {
    if (typeof window === 'undefined' || !editing) return null
    try {
      const saved = JSON.parse(localStorage.getItem(SIZE_STORE) || 'null')
      if (saved && saved.w > 0 && saved.h > 0) return saved
    } catch {
      /* fall through to the stylesheet's size */
    }
    return null
  })

  // Callback refs, not ref objects: a project's editor is created on mount but
  // only attached to a panel when that project is the one on show, and a plain
  // ref would never tell the measuring effect that it had arrived.
  const [panelEl, setPanelEl] = useState(null)
  const [buttonEl, setButtonEl] = useState(null)
  const [panel, setPanel] = useState({ w: 0, h: 0 })
  const [held, setHeld] = useState(-1)
  const EMPTY = { minFace: Infinity, minEdge: Infinity, minBtn: Infinity, flags: new Set() }
  const [report, setReport] = useState(EMPTY)

  useLayoutEffect(() => {
    if (!editing) return
    const el = panelEl
    if (!el) return
    // offset* for the panel rather than getBoundingClientRect: it is mid-pop
    // when this first runs, and a rect would hand back its scaled size.
    const measure = () => {
      setPanel({ w: el.offsetWidth, h: el.offsetHeight })
      setReport(
        inspect(measureBoxes(el), el.offsetWidth, el.offsetHeight, measureButton(el, buttonEl))
      )
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
    // items is in here because moving or resizing one changes every clearance
  }, [editing, size, panelEl, buttonEl, items])

  useEffect(() => {
    if (!editing) return
    try {
      localStorage.setItem(STORE, JSON.stringify(items))
      if (size) localStorage.setItem(SIZE_STORE, JSON.stringify(size))
      else localStorage.removeItem(SIZE_STORE)
    } catch {
      /* private mode, or the quota is full — the arrangement still works */
    }
  }, [editing, items, size, STORE, SIZE_STORE])

  const drag = useRef(null)

  /**
   * The move and release listeners live on the window, not on the sticker.
   *
   * Element handlers plus setPointerCapture look tidy but did not survive a
   * real mouse drag here — only synthetic events reached them. Listening on the
   * window is what actually works, and it keeps the drag alive when the cursor
   * outruns the sticker or leaves the panel.
   */
  useEffect(() => {
    if (!editing) return

    const onMove = (e) => {
      const d = drag.current
      if (!d) return
      e.preventDefault()
      // clamp on the sticker's own measured half-size, so it can be pushed
      // right up to the panel's edge but never past it
      const halfX = (d.w / 2 / d.pw) * 100
      const halfY = (d.h / 2 / d.ph) * 100
      const x = d.x0 + ((e.clientX - d.px) / d.pw) * 100
      const y = d.y0 + ((e.clientY - d.py) / d.ph) * 100
      setItems((prev) =>
        prev.map((it, k) =>
          k === d.i
            ? {
                ...it,
                x: Math.min(100 - halfX, Math.max(halfX, x)),
                y: Math.min(100 - halfY, Math.max(halfY, y)),
              }
            : it
        )
      )
    }

    const onUp = () => {
      if (!drag.current) return
      drag.current = null
      setHeld(-1)
    }

    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [editing])

  const onPointerDown = useCallback(
    (i) => (e) => {
      if (!editing) return
      e.preventDefault()
      const el = panelEl
      if (!el) return
      const inner = e.currentTarget.querySelector('.projects__word, img') || e.currentTarget
      const box = inner.getBoundingClientRect()
      drag.current = {
        i,
        px: e.clientX,
        py: e.clientY,
        x0: items[i].x,
        y0: items[i].y,
        pw: el.offsetWidth,
        ph: el.offsetHeight,
        w: box.width,
        h: box.height,
      }
      setHeld(i)
    },
    [editing, items, panelEl]
  )

  // Wheel over a sticker resizes it, which is the other half of placing them.
  const onWheel = useCallback(
    (i) => (e) => {
      if (!editing) return
      e.preventDefault()
      setItems((prev) =>
        prev.map((it, k) =>
          k === i
            ? { ...it, s: Math.min(2.2, Math.max(0.4, it.s * (1 - e.deltaY * 0.0014))) }
            : it
        )
      )
    },
    [editing]
  )

  // Split in two on purpose: undoing a size experiment must not throw away the
  // placement work, which is the expensive thing to redo.
  const resetSize = useCallback(() => {
    try {
      localStorage.removeItem(SIZE_STORE)
    } catch {
      /* nothing saved to clear */
    }
    setSize(null)
  }, [SIZE_STORE])

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORE)
      localStorage.removeItem(SIZE_STORE)
    } catch {
      /* nothing saved to clear */
    }
    setItems(initial)
    setSize(null)
  }, [initial, STORE, SIZE_STORE])

  /**
   * Resizing the panel is safe for the placement: positions are percentages of
   * it and the faces are sized in container units, so the whole arrangement
   * scales with it. Changing the aspect ratio does move faces relative to one
   * another though, which is why the clearances are recomputed on every change.
   */
  const resize = useCallback(
    (next) => {
      setSize((prev) => {
        // With no override yet, the untouched axis has to come from what the
        // stylesheet is currently rendering — seeding it from `next` would
        // leave that axis undefined and collapse the panel.
        const base = prev || { w: panel.w, h: panel.h }
        const w = Math.round(next.w ?? base.w)
        const h = Math.round(next.h ?? base.h)
        if (!(w > 0) || !(h > 0)) return prev
        return { w, h }
      })
    },
    [panel.w, panel.h]
  )

  // What the panel should render at: the override if there is one, otherwise
  // whatever the stylesheet worked out, so the sliders start where the page is.
  const panelStyle = size ? { '--panel-w': `${size.w}px`, '--panel-h': `${size.h}px` } : null

  return {
    editing,
    items,
    held,
    panel,
    panelStyle,
    resize,
    resetSize,
    panelRef: setPanelEl,
    buttonRef: setButtonEl,
    report,
    reset,
    faceHandlers: (i) => ({
      onPointerDown: onPointerDown(i),
      onWheel: onWheel(i),
    }),
  }
}
