import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ProjectDetail from '../components/ProjectDetail.jsx'
import ScatterStage from '../components/ScatterStage.jsx'
import ScatterToolbar from '../components/ScatterToolbar.jsx'
import { useScatterEditor } from '../hooks/useScatterEditor.js'
import { useInView } from '../hooks/useInView.js'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import './Projects.css'

/**
 * Placed by hand in the ?edit mode on this page, against a panel of 928 x 452 —
 * which is the size committed in Projects.css, so the two must move together.
 *
 * x and y are the centre of each face as a percentage of the panel and s is a
 * multiplier on its base width, so the whole arrangement scales with the panel
 * rather than with the viewport. To change it, open /?edit, drag, and copy the
 * array back out; tools/pack-bubu.py can re-solve one from scratch instead.
 */
const BUBUS = [
  { slug: 'celebrating', alt: 'Bubu looking celebrating', x: 18.3, y: 24.0, s: 1.28, rot: -6, dur: 7.9, delay: -2.5 },
  { slug: 'heart', alt: 'Bubu looking heart eyes', x: 48.8, y: 21.3, s: 1.32, rot: -4, dur: 8.1, delay: -3.1 },
  { slug: 'drool', alt: 'Bubu looking drooling', x: 67.0, y: 24.7, s: 0.70, rot: -6, dur: 6.4, delay: -4.8 },
  { slug: 'crazy', alt: 'Bubu looking crazy', x: 85.0, y: 23.2, s: 1.35, rot: -7, dur: 8.4, delay: -1.9 },
  { slug: 'sleepy', alt: 'Bubu looking sleepy', x: 31.6, y: 34.0, s: 1.00, rot: 4, dur: 8.6, delay: -2.1 },
  { slug: 'shy', alt: 'Bubu looking shy', x: 70.3, y: 51.0, s: 1.25, rot: 8, dur: 6.9, delay: -0.3 },
  { slug: 'stressed', alt: 'Bubu looking stressed', x: 18.2, y: 50.9, s: 0.88, rot: -4, dur: 6.6, delay: -3.9 },
  { slug: 'awkward', alt: 'Bubu looking awkward', x: 86.6, y: 52.9, s: 0.92, rot: 7, dur: 8.2, delay: -2.8 },
  { slug: 'wink', alt: 'Bubu looking winking', x: 32.1, y: 57.1, s: 0.72, rot: 5, dur: 6.2, delay: -1.4 },
  { slug: 'excited', alt: 'Bubu looking excited', x: 86.1, y: 76.4, s: 0.85, rot: 7, dur: 6.8, delay: -0.7 },
  { slug: 'cool', alt: 'Bubu looking cool', x: 19.4, y: 79.4, s: 1.40, rot: -8, dur: 7.5, delay: 0 },
  { slug: 'sad', alt: 'Bubu looking sad', x: 53.1, y: 77.5, s: 1.30, rot: 5, dur: 7.7, delay: -1.1 },
  { slug: 'swirl', alt: 'Bubu looking dizzy', x: 70.7, y: 78.9, s: 0.95, rot: 6, dur: 6.5, delay: -4.2 },
  { slug: 'confused', alt: 'Bubu looking confused', x: 37.3, y: 79.5, s: 0.78, rot: -5, dur: 7.1, delay: -3.6 },
]


/**
 * Project 2's hands, placed by hand in ?edit against a panel of 928 x 452 —
 * which is the size committed below, so the two must move together. The
 * signs are square where the Bubu faces are not, and there are twenty of them
 * rather than fourteen, so they run smaller — see --sticker in the .is-kukai
 * block in Projects.css.
 */
const KUKAI = [
  { slug: 'y', alt: 'Sign language: the letter Y', x: 25.8, y: 15.2, s: 0.80, rot: 8, dur: 6.9, delay: -4.1 },
  { slug: 'c', alt: 'Sign language: the letter C', x: 92.4, y: 15.8, s: 1.42, rot: -5, dur: 6.1, delay: -4.3 },
  { slug: 'v', alt: 'Sign language: the letter V', x: 52.1, y: 16.8, s: 0.92, rot: 6, dur: 7.9, delay: -2.1 },
  { slug: 'hello', alt: 'Sign language: “hello”', x: 11.0, y: 17.2, s: 1.40, rot: 4, dur: 8.7, delay: -2.0 },
  { slug: 'a', alt: 'Sign language: the letter A', x: 67.9, y: 17.8, s: 1.50, rot: -9, dur: 6.2, delay: -2.7 },
  { slug: 'small', alt: 'Sign language: “small”', x: 38.2, y: 20.0, s: 1.05, rot: -5, dur: 6.2, delay: -1.5 },
  { slug: 'stop', alt: 'Sign language: “stop”', x: 79.8, y: 27.9, s: 0.84, rot: 4, dur: 7.6, delay: -4.5 },
  { slug: 'good', alt: 'Sign language: “good”', x: 28.2, y: 36.6, s: 0.75, rot: -7, dur: 7.6, delay: -3.1 },
  { slug: 'call-me', alt: 'Sign language: “call me”', x: 94.4, y: 47.9, s: 0.70, rot: -7, dur: 6.7, delay: -2.8 },
  { slug: 'yes', alt: 'Sign language: “yes”', x: 74.1, y: 48.0, s: 0.88, rot: -5, dur: 6.1, delay: -2.2 },
  { slug: 'f', alt: 'Sign language: the letter F', x: 13.5, y: 51.7, s: 1.38, rot: 6, dur: 8.5, delay: -3.6 },
  { slug: 'bad', alt: 'Sign language: “bad”', x: 86.0, y: 61.8, s: 1.02, rot: -6, dur: 6.3, delay: -2.9 },
  { slug: 'w', alt: 'Sign language: the letter W', x: 31.5, y: 63.4, s: 1.35, rot: 4, dur: 7.3, delay: -4.6 },
  { slug: 'b', alt: 'Sign language: the letter B', x: 53.0, y: 77.0, s: 0.78, rot: -5, dur: 7.0, delay: -2.7 },
  { slug: 'l', alt: 'Sign language: the letter L', x: 66.5, y: 80.4, s: 1.45, rot: -5, dur: 7.8, delay: -2.9 },
  { slug: 'i', alt: 'Sign language: the letter I', x: 80.3, y: 81.4, s: 0.72, rot: -9, dur: 8.3, delay: -0.6 },
  { slug: 'd', alt: 'Sign language: the letter D', x: 21.1, y: 81.4, s: 0.86, rot: -9, dur: 7.6, delay: -2.0 },
  { slug: 'i-love-you', alt: 'Sign language: “i love you”', x: 9.5, y: 82.5, s: 0.98, rot: -4, dur: 7.7, delay: -0.4 },
  { slug: 'come-here', alt: 'Sign language: “come here”', x: 92.8, y: 84.3, s: 0.82, rot: 4, dur: 6.8, delay: -4.0 },
  { slug: 'you', alt: 'Sign language: “you”', x: 42.0, y: 84.7, s: 0.95, rot: -4, dur: 7.2, delay: -2.7 },
]


/**
 * Project 3: the twenty-five prophets named in the Qur'an, in Arabic.
 *
 * Extracted from DD.pdf by tools/extract-prophets.py rather than retyped — the
 * PDF stores the Arabic as visually-ordered runs, so the text has to be
 * reassembled, and every vowel mark is checked to be sitting on a letter before
 * it is emitted. Do not edit these strings by hand; re-run the extractor.
 *
 * These are text, not images, so `s` scales the type rather than a width.
 * Positions were placed by hand in ?edit against the committed 928 x 452 panel.
 */
const DEEN = [
  { slug: 'ishaq', ar: 'إِسْحَاق', alt: 'Ishaq', x: 8.9, y: 15.4, s: 1.15, rot: -3, dur: 7.2, delay: -4.2 },
  { slug: 'sulayman', ar: 'سُلَيْمَان', alt: 'Sulayman', x: 77.9, y: 14.7, s: 0.90, rot: -3, dur: 6.9, delay: -1.6 },
  { slug: 'zakariya', ar: 'زَكَرِيَّا', alt: 'Zakariya', x: 23.2, y: 17.0, s: 1.10, rot: -4, dur: 8.8, delay: -3.8 },
  { slug: 'yunus', ar: 'يُونُس', alt: 'Yunus', x: 89.4, y: 16.8, s: 1.30, rot: -4, dur: 7.9, delay: -0.9 },
  { slug: 'ismail', ar: 'إِسْمَاعِيل', alt: 'Ismail', x: 38.1, y: 18.3, s: 0.85, rot: -4, dur: 8.5, delay: -3.0 },
  { slug: 'muhammad', ar: 'مُحَمَّد', alt: 'Muhammad', x: 64.7, y: 20.4, s: 1.35, rot: -3, dur: 8.8, delay: -0.1 },
  { slug: 'harun', ar: 'هَارُون', alt: 'Harun', x: 51.9, y: 21.5, s: 0.92, rot: -5, dur: 8.4, delay: -0.0 },
  { slug: 'idris', ar: 'إِدْرِيس', alt: 'Idris', x: 71.9, y: 28.9, s: 0.90, rot: 4, dur: 8.4, delay: -0.9 },
  { slug: 'lut', ar: 'لُوط', alt: 'Lut', x: 84.9, y: 37.5, s: 1.35, rot: -5, dur: 8.3, delay: -0.3 },
  { slug: 'ilyas', ar: 'إِلْيَاس', alt: 'Ilyas', x: 26.6, y: 39.1, s: 1.00, rot: 3, dur: 8.1, delay: -0.6 },
  { slug: 'adam', ar: 'آدَم', alt: 'Adam', x: 9.0, y: 39.5, s: 1.30, rot: 4, dur: 8.4, delay: -3.9 },
  { slug: 'al-yasa', ar: 'الْيَسَع', alt: 'Al-Yasa', x: 76.2, y: 50.8, s: 1.20, rot: 5, dur: 6.3, delay: -0.3 },
  { slug: 'musa', ar: 'مُوسَى', alt: 'Musa', x: 14.7, y: 52.0, s: 1.40, rot: 3, dur: 6.3, delay: -1.5 },
  { slug: 'yahya', ar: 'يَحْيَى', alt: 'Yahya', x: 92.2, y: 51.7, s: 1.45, rot: 5, dur: 7.1, delay: -2.0 },
  { slug: 'ibrahim', ar: 'إِبْرَاهِيم', alt: 'Ibrahim', x: 23.1, y: 64.8, s: 1.10, rot: 5, dur: 8.1, delay: -3.3 },
  { slug: 'hud', ar: 'هُود', alt: 'Hud', x: 84.6, y: 68.3, s: 1.20, rot: 3, dur: 6.8, delay: -0.5 },
  { slug: 'isa', ar: 'عِيسَى', alt: 'Isa', x: 40.0, y: 72.1, s: 0.95, rot: -5, dur: 6.8, delay: -4.9 },
  { slug: 'dhul-kifl', ar: 'ذُو الْكِفْل', alt: 'Dhul-Kifl', x: 61.4, y: 72.8, s: 0.85, rot: -5, dur: 7.3, delay: -4.9 },
  { slug: 'dawud', ar: 'دَاوُود', alt: 'Dawud', x: 8.6, y: 76.1, s: 1.05, rot: 3, dur: 6.2, delay: -3.1 },
  { slug: 'nuh', ar: 'نُوح', alt: 'Nuh', x: 75.4, y: 79.7, s: 1.45, rot: 3, dur: 7.8, delay: -4.0 },
  { slug: 'yusuf', ar: 'يُوسُف', alt: 'Yusuf', x: 17.8, y: 87.2, s: 1.00, rot: -5, dur: 7.3, delay: -1.4 },
  { slug: 'salih', ar: 'صَالِح', alt: 'Salih', x: 32.5, y: 87.3, s: 0.95, rot: 5, dur: 6.1, delay: -4.9 },
  { slug: 'shu-ayb', ar: 'شُعَيْب', alt: 'Shu\u2019ayb', x: 50.4, y: 87.6, s: 0.88, rot: 4, dur: 6.8, delay: -0.4 },
  { slug: 'yaqub', ar: 'يَعْقُوب', alt: 'Yaqub', x: 62.9, y: 88.2, s: 0.95, rot: -4, dur: 7.8, delay: -2.5 },
  { slug: 'ayyub', ar: 'أَيُّوب', alt: 'Ayyub', x: 90.5, y: 87.8, s: 1.25, rot: -5, dur: 8.0, delay: -1.6 },
]

/**
 * The three projects. Each supplies its own scatter; the palette and the
 * sticker scale that go with it live in the .is-<id> blocks in Projects.css.
 */
const PROJECTS = [
  {
    id: 'bubu',
    name: 'BUBU',
    tagline: 'An AI companion that pays attention to how you feel, not just what you say.',
    items: BUBUS,
    // No recording of the app yet, so the page draws the face itself, with
    // the app's own renderer. `reel` is the still fallback for a viewer who
    // has asked for no motion; setting `video` here takes over from both.
    face: true,
    reel: BUBUS,
    // Prose, like the other two. It was a lead and four bullets, which read as
    // a feature list next to two pages that read as an account of the work.
    body: [
      'BUBU is an Affective AI companion that you talk to instead of type to. There is no traditional chat window \u2014 you simply speak, and BUBU listens, watches your expressions through the camera, and responds out loud through an animated face.',
      'It looks at your words, voice, and facial expression together to better understand the mood behind what you are saying. So when someone says \u201cI\u2019m fine\u201d but sounds exhausted, BUBU can recognise that those signals may not match and respond more naturally.',
      'BUBU also remembers important details between visits, so conversations do not always feel like starting from zero. It is designed for support, not medical advice: it does not diagnose or pretend to be a therapist, and when a conversation suggests someone may be in immediate danger, it directs them toward real-world crisis support.',
      'I built the experience from the ground up, including a face, on-device emotion sensing, voice interaction, memory, user accounts, and the systems needed to make everything work together smoothly.',
    ],
    meta: 'Android \u00b7 English \u00b7 coming to Google Play',
  },
  {
    id: 'kukai',
    name: 'KUKAI',
    repo: 'https://github.com/AmthuzZafrin/KUKAI',
    tagline: 'A two-way Indian Sign Language assistant that helps people communicate and learn.',
    items: KUKAI,
    video: '/projects/kukai-demo.mp4',
    poster: '/projects/kukai-poster.jpg',
    // The plate is held at the recording's own shape before it loads, so the
    // page does not change height when it arrives. The two recordings are not
    // the same shape — this one is 16 : 9, Deen's capture was a wider desktop.
    ratio: '1280 / 720',
    body: [
      'KUKAI helps bridge communication between Indian Sign Language and spoken or written language.',
      'Point a webcam at your hand, make a sign, and KUKAI identifies it and converts it into text \u2014 or speaks it aloud in English or Tamil. You can also do the opposite: type a word and KUKAI shows you the corresponding sign.',
      'The website also includes a learning section where people can explore signs by category, including alphabets, numbers, days, colours, family members, and common words.',
      'To make recognition more dependable, the system only accepts a sign when it is sufficiently confident. Unclear or partially hidden gestures are ignored instead of being turned into a random answer.',
      'I worked across the full project, from collecting training examples and teaching the recognition model to building the final application and making it run efficiently on a normal laptop.',
    ],
  },
  {
    id: 'deen',
    name: 'Deen & Daleel',
    repo: 'https://github.com/AmthuzZafrin/deen-daleel',
    tagline: 'An Islamic research assistant that shows you the evidence behind every answer.',
    items: DEEN,
    video: '/projects/deen-demo.mp4',
    poster: '/projects/deen-demo-poster.webp',
    ratio: '1280 / 666',
    body: [
      'Deen & Daleel lets people ask Islamic questions and receive an answer together with the original evidence behind it \u2014 including Qur\u2019an verses, hadith, tafsir, and scholarly writings. Instead of simply asking the user to trust an answer, the website lets them open the sources and read them for themselves.',
      'The answers are prepared and carefully checked before they are published. When a question is unclear or outside the available knowledge, Deen & Daleel does not make up an answer. It shows the closest relevant sources instead.',
      'I built the system around a large collection of more than 6,600 Islamic texts, turning them into a searchable library and connecting 488 carefully prepared answers to the sources they rely on. Every quotation is checked against its original source before it is published, with references designed to remain reliable even when the library is updated.',
    ],
  },
]

/** A project opens a page of its own once it has something to say on one. */
const hasPage = (project) => Boolean(project.lead || project.body)

export default function Projects() {
  const [ref, inView] = useInView({ threshold: 0.3 })
  const reduced = usePrefersReducedMotion()
  const [selected, setSelected] = useState(0)
  // Which project's own page is open, by id. Null is the work section itself.
  const [opened, setOpened] = useState(null)

  // One editor per buildable project, so each keeps its own saved arrangement.
  // Hooks cannot be called conditionally, so both always run; only the selected
  // one is ever wired to a panel.
  const editors = [
    useScatterEditor(BUBUS, 'bubu'),
    useScatterEditor(KUKAI, 'kukai'),
    useScatterEditor(DEEN, 'deen'),
  ]

  // The panel pops in — undershoot then a small overshoot past full size, so it
  // arrives like something opening rather than fading up.
  const panel = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, scale: 0.86, y: 22 },
    shown: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: reduced ? 0.4 : 0.62,
        ease: [0.34, 1.5, 0.5, 1],
        staggerChildren: reduced ? 0 : 0.045,
        delayChildren: reduced ? 0 : 0.16,
      },
    },
  }

  const pop = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 },
    shown: {
      opacity: 1,
      scale: 1,
      transition: { duration: reduced ? 0.4 : 0.55, ease: [0.34, 1.4, 0.64, 1] },
    },
  }

  const editing = editors.some((e) => e.editing)
  // The drag editor only makes sense on the large panel, and only for the
  // project currently shown there.
  const live = editors[selected] ?? null

  const stageFor = (project, editor, live) =>
    project.items ? (
      <ScatterStage
        dir={project.id}
        label={project.name}
        items={editor?.editing ? editor.items : project.items}
        pop={pop}
        editor={editor}
        // Only the feature panel opens a page, and only when the project has
        // one — a thumbnail's button selects the project instead, and in edit
        // mode a press on the button is the start of a drag.
        onOpen={live && hasPage(project) && !editing ? () => setOpened(project.id) : undefined}
      />
    ) : (
      <span className="projects__todo">{project.name}</span>
    )

  const detail = PROJECTS.find((p) => p.id === opened)

  return (
    <>
    <section
      id="projects"
      className={`section section--center is-${PROJECTS[selected].id}`}
      ref={ref}
    >
      <motion.h2
        className="section-title projects__title"
        variants={pop}
        initial={editing ? 'shown' : 'hidden'}
        animate={editing || inView ? 'shown' : 'hidden'}
      >
        The Gen AI work
      </motion.h2>

      <motion.p
        className="section-sub"
        variants={pop}
        initial={editing ? 'shown' : 'hidden'}
        animate={editing || inView ? 'shown' : 'hidden'}
      >
        Three products, built end to end — open one to read how.
      </motion.p>

      <motion.div
        className="projects__stage"
        // The size override lives here, not on the panel: the grid column
        // reads --panel-w, and --panel-h inherits down to the panel itself.
        style={live?.editing ? live.panelStyle : null}
        variants={panel}
        // In edit mode there is nothing to reveal: you are placing things, so
        // they should already be where they will end up.
        initial={editing ? 'shown' : 'hidden'}
        animate={editing || inView ? 'shown' : 'hidden'}
      >
        <div
          key={PROJECTS[selected].id}
          className={`glass projects__box is-${PROJECTS[selected].id}${
            live?.editing ? ' is-editing' : ''
          }`}
          ref={live?.editing ? live.panelRef : null}
        >
          {stageFor(PROJECTS[selected], live, true)}
        </div>

        <div className="projects__rail">
          {PROJECTS.map((project, i) => (
            <button
              type="button"
              key={project.id}
              className={`glass projects__thumb is-${project.id}${
                i === selected ? ' is-current' : ''
              }`}
              aria-pressed={i === selected}
              aria-label={`Show ${project.name}`}
              onClick={() => setSelected(i)}
            >
              {stageFor(project, null, false)}
            </button>
          ))}
        </div>
      </motion.div>

      {live?.editing && (
        <ScatterToolbar
          items={live.items}
          report={live.report}
          panel={live.panel}
          onResize={live.resize}
          onResetSize={live.resetSize}
          onReset={live.reset}
        />
      )}
    </section>

      {/* Outside the section on purpose: .section clips its overflow and the
          stage carries a transform, either of which would trap a fixed child. */}
      <AnimatePresence>
        {detail && <ProjectDetail key={detail.id} project={detail} onClose={() => setOpened(null)} />}
      </AnimatePresence>
    </>
  )
}
