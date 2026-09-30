import './Hero.css'

/**
 * The tally along the foot of the page.
 *
 * In the order the figures run rather than the order the work does, which
 * is what makes the row read as a row: 1, 2, 3, 4, 21, 30.
 *
 * They are as given and are not read off the sections they name. Three of
 * the six agree with what the site shows — 1 novel, 3 projects, 4
 * internships — and three do not: the Websites page has one site on it, the
 * Certificates page twenty, and the Skills page twenty-nine. So they live
 * here, on one line each, to be easy to correct.
 */
const TALLY = [
  ['1', 'Novel'],
  ['2', 'Websites'],
  ['3', 'Projects'],
  ['4', 'Internships'],
  ['21', 'Certificates'],
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
        {/* A wrapper that is `display: contents` on a wide window — the two
            blocks inside it place themselves against the picture, one on the
            light and one along the foot. On a narrow one it becomes a real
            box and they stack inside it, because there is no room to do
            both: the light is 0.2146W above the foot, so the gap between
            them shrinks with the WIDTH while the strip's own height does
            not, and below about 60rem the two meet. */}
        <div className="hero__type">
          <div className="hero__intro">
            <h1 className="hero__name">
              <img src="/hero-name.svg" alt="Amthuz Zafrin" />
            </h1>

            <p className="hero__role">
              <img src="/hero-role.svg" alt="Gen AI Engineer, Full-Stack Developer" />
            </p>
          </div>

          {/* Along the foot, and a sibling of the block above rather than a
              child of it: that block is placed by ITS foot, so anything hung
              inside it would move the role off the light in the picture. */}
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
