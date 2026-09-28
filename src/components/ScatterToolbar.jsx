import { useState } from 'react'
import { toSource } from '../lib/scatterLayout.js'
import './ScatterToolbar.css'

const fmt = (n) => (Number.isFinite(n) ? Math.round(n) + 'px' : '—')

/**
 * The bar along the bottom in ?edit mode. It reports the three clearances live
 * while you drag, so you can see a face go tight before you let go of it.
 */
export default function ScatterToolbar({ items, report, panel, onResize, onResetSize, onReset }) {
  const [copied, setCopied] = useState(false)
  const [fallback, setFallback] = useState('')

  const copy = async () => {
    const text = toSource(items, panel)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // The clipboard is blocked in some contexts (an unfocused tab, a
      // non-secure origin). Fall back to a selectable box — never a prompt or
      // an alert, which would freeze the page behind a modal.
      console.log(text)
      setFallback(text)
    }
  }

  const bad = report.flags.size > 0

  return (
    <div className="scatter-toolbar">
      <span className="scatter-toolbar__hint">drag · wheel to resize</span>

      <label className="scatter-toolbar__size">
        w
        <input
          type="range"
          min="480"
          max="1400"
          step="8"
          value={Math.round(panel.w) || 0}
          onChange={(e) => onResize({ w: +e.target.value })}
        />
        {Math.round(panel.w)}
      </label>
      <label className="scatter-toolbar__size">
        h
        <input
          type="range"
          min="300"
          max="820"
          step="8"
          value={Math.round(panel.h) || 0}
          onChange={(e) => onResize({ h: +e.target.value })}
        />
        {Math.round(panel.h)}
      </label>

      <span className={`scatter-toolbar__stat${report.minFace < 12 ? ' is-bad' : ''}`}>
        face {fmt(report.minFace)}
      </span>
      <span className={`scatter-toolbar__stat${report.minEdge < 12 ? ' is-bad' : ''}`}>
        edge {fmt(report.minEdge)}
      </span>
      <span className={`scatter-toolbar__stat${report.minBtn < 40 ? ' is-bad' : ''}`}>
        button {fmt(report.minBtn)}
      </span>

      <span className={`scatter-toolbar__verdict${bad ? ' is-bad' : ''}`}>
        {bad ? `${report.flags.size} too close` : 'all clear'}
      </span>

      <button type="button" onClick={copy}>
        {copied ? 'copied' : 'copy array'}
      </button>
      <button type="button" onClick={onResetSize} title="panel back to the stylesheet size">
        reset size
      </button>
      <button type="button" onClick={onReset} title="discard all placement and size work">
        reset all
      </button>

      {fallback && (
        <textarea
          className="scatter-toolbar__fallback"
          readOnly
          value={fallback}
          onFocus={(e) => e.target.select()}
          autoFocus
        />
      )}
    </div>
  )
}
