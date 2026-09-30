import './Hero.css'

/**
 * The tally under the role.
 *
 * These are the figures as given, and they are not read off the sections
 * they name — the site itself shows 3 AI products and 1 commissioned site,
 * 19 certificates and 29 skills. Anyone who counts will find that, so the
 * three numbers live here on one line to be easy to correct.
 */
const TALLY = [
  ['6', 'Works'],
  ['25', 'Certificates'],
  ['30', 'Skills'],
]

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
            page they came out black. They are not drawn at all now — see
            tools/prep-hero-name.py, which has how the marks are told from the
            counters and the four things tried before it. Vector, so it stays
            sharp at any size, and each line keeps its own alt text. */}
        <div className="hero__intro">
          <h1 className="hero__name">
            <img src="/hero-name.svg" alt="Amthuz Zafrin" />
          </h1>

          <p className="hero__role">
            <img src="/hero-role.svg" alt="Gen AI Engineer, Full-Stack Developer" />
          </p>

          {/* Out of the block's flow on purpose. The block is positioned by
              its foot so the role lands on the light in the picture, so
              anything added under the role in flow would push the role — and
              the name with it — off that line. */}
          <ul className="hero__tally">
            {TALLY.map(([count, label]) => (
              <li key={label}>
                <span className="hero__tally-n">{count}</span>
                <span className="hero__tally-l">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
