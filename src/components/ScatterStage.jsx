import { motion } from 'framer-motion'

/**
 * A project's composition: its glowing button with stickers scattered round it.
 *
 * It renders at whatever size its container is — positions are percentages and
 * every size is in container units — so the same component serves as both the
 * large feature panel and the small thumbnail in the rail.
 *
 * `editor` is only passed to the feature instance under ?edit; thumbnails get
 * null and render inert.
 */
export default function ScatterStage({ dir, label, items, pop, editor, onOpen }) {
  const live = editor?.editing ? editor : null

  return (
    <>
      {items.map(({ slug, ar, alt, x, y, s, rot, dur, delay }, i) => (
        <div
          key={slug}
          /* The positioning wrapper. Its translate(-50%, -50%) is the only
             transform on it and is never animated — the pop lives on the
             child, because a motion component writes transform wholesale and
             would otherwise wipe the centring out from under the layout. */
          className={
            'projects__sticker' +
            (ar ? ' projects__sticker--text' : '') +
            (live?.report.flags.has(i) ? ' is-clashing' : '') +
            (live?.held === i ? ' is-held' : '')
          }
          style={{ left: `${x}%`, top: `${y}%`, '--s': s }}
          {...(live ? live.faceHandlers(i) : null)}
        >
          <motion.div className="projects__sticker-pop" variants={pop}>
            {ar ? (
              /* A word rather than a picture. lang and dir let the browser
                 shape and order the Arabic itself; the transliteration rides
                 along as the accessible name. */
              <span
                className="projects__word"
                lang="ar"
                dir="rtl"
                title={alt}
                style={{ '--rot': `${rot}deg`, '--dur': `${dur}s`, '--delay': `${delay}s` }}
              >
                {ar}
              </span>
            ) : (
              <img
                src={`/${dir}/${slug}.webp`}
                alt={alt}
                loading="lazy"
                draggable="false"
                style={{ '--rot': `${rot}deg`, '--dur': `${dur}s`, '--delay': `${delay}s` }}
              />
            )}
          </motion.div>
        </div>
      ))}

      <motion.button
        type="button"
        className={`glow-btn${onOpen ? ' is-linked' : ''}`}
        ref={live?.buttonRef}
        variants={pop}
        // Only the projects that have a page of their own are pressable; the
        // rest keep the button as the composition's centrepiece and nothing
        // more. Never in edit mode, where a press means a drag.
        onClick={onOpen}
        aria-label={onOpen ? `${label} — open the project` : undefined}
      >
        {/* The label is its own element so it can carry a gradient fill of
            its own — background-clip on the button would clip the button's
            body instead. */}
        <span className="glow-btn__label">{label}</span>
      </motion.button>
    </>
  )
}
