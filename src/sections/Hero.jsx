import './Hero.css'

/**
 * The first page.
 *
 * The pin is a fixed inner box inside an in-flow spacer, rather than
 * `position: sticky` on the section itself. Sticky would work visually, but a
 * stuck element reports its stuck position as offsetTop — so the nav's Home
 * link and the snap points would both be reading a number that moves as you
 * scroll. The spacer keeps the scroll geometry ordinary; only the painting is
 * unusual.
 *
 * The masthead that used to be here — the serif name, the typed line, the
 * moon — is parked whole in tools/assets/hero/.
 */
export default function Hero() {
  return (
    <div id="hero" className="hero-pin">
      <section className="section section--center hero-pin__page hero">
        {/* Decoration, and it says nothing, so it is hidden. */}
        <div className="hero__ai" aria-hidden="true" />

        {/* Drawn rather than set. The display face hides a gloss mark inside
            every letter and those marks are holes in the glyph, so on a black
            page they came out black; the only way to have them white is to
            paint each glyph's outer contour underneath, which CSS cannot name.
            See tools/prep-hero-name.py — it has the four things that were
            tried before this one. Vector, so it stays sharp at any size. */}
        <div className="hero__intro">
          <h1 className="hero__name">
            <img src="/hero-name.svg" alt="Amthuz Zafrin" />
          </h1>

          <p className="hero__role">
            <img src="/hero-role.svg" alt="Gen AI Engineer, Full-Stack Developer" />
          </p>
        </div>
      </section>
    </div>
  )
}
