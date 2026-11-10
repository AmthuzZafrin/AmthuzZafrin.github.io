import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from '../hooks/useInView.js'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import { useScrollThrough } from '../hooks/useScrollThrough.js'
import './Research.css'

/**
 * Where the paper lives.
 *
 * The DOI is the concept DOI, so it always resolves to the newest version's
 * Zenodo page, which carries the abstract and a preview. The PDF is a file on
 * that record, and Zenodo serves it as a download rather than opening it.
 */
const PAPER = {
  doi: 'https://doi.org/10.5281/zenodo.24054486',
  pdf: 'https://zenodo.org/records/24054487/files/Zafrin_2026_A_Fear_of_Its_Own.pdf?download=1',
  code: 'https://github.com/AmthuzZafrin/a-fear-of-its-own',
}

const LINKS = [
  { label: 'Paper (DOI)', href: PAPER.doi },
  { label: 'PDF', href: PAPER.pdf },
  { label: 'Code and data', href: PAPER.code },
]

/**
 * The four results, as the paper states them. Each is a lead-in and the rest
 * of the sentence, so the figure that carries the result can be set apart
 * from the words around it without the wording changing.
 */
const FINDINGS = [
  [
    'The agents developed a lasting threat state that met the criteria used for animals, ',
    'but so did a belief-only twin.',
    '',
  ],
  [
    'A stakes sign separated them. At the same belief, the agents’ state lasted ',
    'two to three times longer',
    ' when their body was wounded. This replicated in new agents and showed in their choices.',
  ],
  [
    'Agents rewarded only for gems reacted to a painless shutdown as they did to a predator. Paying them for their lost future stopped them avoiding it, but left ',
    '56%',
    ' of the internal response.',
  ],
  [
    'Copies inherited every behavioural sign but stayed fitted to their teacher’s body. This misfit told grown fear from copied fear ',
    '(AUC 0.99)',
    '.',
  ],
]

/** Exactly as the paper's record gives it; the Copy button copies this string. */
const BIBTEX = `@misc{zafrin2026fear,
  author    = {F, Amthuz Zafrin},
  title     = {A Fear of Its Own? Telling Fear from Belief and Imitation in Agents Trained Without Human Data},
  year      = {2026},
  publisher = {Zenodo},
  doi       = {10.5281/zenodo.24054486},
  url       = {https://doi.org/10.5281/zenodo.24054486}
}`

/**
 * The paper, laid out the way the book is on the Novel page: its first page held
 * up in a lit rim, and the copy standing on the page beside it rather than in
 * a panel. Where there is room, the title runs across the top and two columns
 * sit under it — what the paper did, and what it found — so the whole of it
 * is read on one screen.
 *
 * The citation is the one thing here only a few visitors want, so it waits
 * behind a button rather than putting a block of BibTeX on every screen.
 */
export default function Research() {
  const [ref, inView] = useInView({ threshold: 0.25 })
  const reduced = usePrefersReducedMotion()

  // Stacked into one column on a phone, this is taller than the window.
  useScrollThrough('research')

  const stage = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 22 },
    shown: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduced ? 0.4 : 0.6,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: reduced ? 0 : 0.05,
        delayChildren: reduced ? 0 : 0.12,
      },
    },
  }

  const pop = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 },
    shown: {
      opacity: 1,
      scale: 1,
      transition: { duration: reduced ? 0.4 : 0.6, ease: [0.34, 1.3, 0.64, 1] },
    },
  }

  const rise = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 14 },
    shown: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0.4 : 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  }

  return (
    <section id="research" className="section section--center" ref={ref}>
      <motion.h2
        className="section-title research__title"
        variants={rise}
        initial="hidden"
        animate={inView ? 'shown' : 'hidden'}
      >
        The Research
      </motion.h2>

      <motion.p
        className="section-sub"
        variants={rise}
        initial="hidden"
        animate={inView ? 'shown' : 'hidden'}
      >
        A preprint, what it found, and the code and data to check it.
      </motion.p>

      <motion.div
        className="research__stage"
        variants={stage}
        initial="hidden"
        animate={inView ? 'shown' : 'hidden'}
      >
        {/* The page opens the paper rather than a larger picture of itself:
            one page of a thirty-six page paper, enlarged, is still one page. */}
        <motion.a
          className="research__plate"
          href={PAPER.doi}
          target="_blank"
          rel="noreferrer noopener"
          aria-label="A Fear of Its Own? — open the paper on Zenodo"
          variants={pop}
        >
          <img
            src="/research/a-fear-of-its-own.webp"
            alt="The paper’s first page: its title, author and abstract"
            width="1082"
            height="1400"
            loading="lazy"
            decoding="async"
          />
        </motion.a>

        {/* Across both columns of copy, so the title gets a line of its own
            and the two columns under it start level. */}
        <div className="research__head">
          <motion.p className="research__eyebrow" variants={rise}>
            Preprint · Zenodo · November 2026
          </motion.p>

          <motion.h3 className="research__name" variants={rise}>
            <span className="research__name-main">A Fear of Its Own?</span>
            <span className="research__name-sub">
              Telling Fear from Belief and Imitation in Agents Trained Without Human Data
            </span>
          </motion.h3>

          <motion.p className="research__author" variants={rise}>
            Amthuz Zafrin F · Independent Researcher
          </motion.p>
        </div>

        <div className="research__paper">
          <motion.p className="research__lede" variants={rise}>
            When an AI system shows a sign of fear, is that state its own, a copy of ours, or just a
            belief about danger? I trained small recurrent agents by reinforcement learning, with no
            human data, to keep a vulnerable body alive under hidden danger. I then tested them
            against fakes built on purpose: a belief-only twin, copycats and untrained networks.
          </motion.p>

          <motion.div className="research__links" variants={rise}>
            {LINKS.map(({ label, href }) => (
              <a
                key={label}
                className="research__link"
                href={href}
                target="_blank"
                rel="noreferrer noopener"
              >
                {label}
              </a>
            ))}
            <button type="button" className="research__cite-open" popoverTarget="research-cite">
              Cite
            </button>
          </motion.div>

          {/* On the page's bottom edge, under the copy it qualifies. */}
          <motion.div className="research__note" variants={rise}>
            <span className="research__label">Scope and disclosure</span>
            <p>
              This work studies functional states only and makes no claim that anything is felt. An
              AI assistant (Claude) wrote the code, ran the experiments and drafted the text under my
              direction; the paper discloses this in full.
            </p>
          </motion.div>
        </div>

        <div className="research__found">
          <motion.p className="research__label" variants={rise}>
            What it found
          </motion.p>

          {/* Numbered, because they are read in order: the second is what
              separated the agents from the twin the first one introduced. */}
          <ol className="research__findings">
            {FINDINGS.map(([lead, mark, tail]) => (
              <motion.li key={lead} className="research__finding" variants={rise}>
                {lead}
                <strong>{mark}</strong>
                {tail}
              </motion.li>
            ))}
          </ol>
        </div>
      </motion.div>

      <Cite />

      {/* The section's own end, as a snap point, for when it is stacked and
          taller than the window — see useScrollThrough. */}
      <div className="section-end" aria-hidden="true" />
    </section>
  )
}

/**
 * The BibTeX, over the page.
 *
 * A native popover rather than a dialog of this site's own: the browser puts
 * it above the bar, closes it on Escape or a click anywhere outside it, and
 * gives focus back to the button that opened it — the three things a
 * home-made overlay most often gets wrong. Where popovers are not supported
 * the block simply sits on the page, which is a fine way to read a citation.
 */
function Cite() {
  const [copied, setCopied] = useState(false)
  const code = useRef(null)
  const copy = useRef(null)

  // The confirmation is a moment, not a state the button stays in.
  useEffect(() => {
    if (!copied) return undefined
    const t = setTimeout(() => setCopied(false), 1800)
    return () => clearTimeout(t)
  }, [copied])

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(BIBTEX)
      setCopied(true)
    } catch {
      // The clipboard was refused — a browser that asks first, or a page not
      // served over https. Select the text instead, so one keystroke finishes
      // the job.
      const range = document.createRange()
      range.selectNodeContents(code.current)
      const selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }

  return (
    <div
      id="research-cite"
      className="research__cite"
      popover="auto"
      role="dialog"
      aria-labelledby="research-cite-name"
      // Straight onto Copy when it opens, since that is what it was opened for.
      onToggle={(e) => {
        if (e.newState === 'open') copy.current?.focus()
        else setCopied(false)
      }}
    >
      <div className="research__cite-bar">
        <p className="research__cite-name" id="research-cite-name">
          Cite this paper
        </p>
        <button type="button" className="research__cite-act" ref={copy} onClick={onCopy}>
          {/* Announced, because the change is the only sign it worked. */}
          <span aria-live="polite">{copied ? 'Copied' : 'Copy BibTeX'}</span>
        </button>
        <button
          type="button"
          className="research__cite-act"
          popoverTarget="research-cite"
          popoverTargetAction="hide"
        >
          Close <span aria-hidden="true">✕</span>
        </button>
      </div>

      <pre className="research__bibtex">
        <code ref={code}>{BIBTEX}</code>
      </pre>
    </div>
  )
}
