import TopNav from './components/TopNav.jsx'
import ZoomProvider from './components/Zoom.jsx'
import Hero from './sections/Hero.jsx'
import Summary from './sections/Summary.jsx'
import Projects from './sections/Projects.jsx'
import Commission from './sections/Commission.jsx'
import Certificates from './sections/Certificates.jsx'
import Experience from './sections/Experience.jsx'
import Education from './sections/Education.jsx'
import Skills from './sections/Skills.jsx'
import Novel from './sections/Novel.jsx'
import Contact from './sections/Contact.jsx'

export default function App() {
  return (
    <ZoomProvider>
      <TopNav />
      <main className="page">
        <Hero />
        <Summary />
        <Projects />
        <Commission />
        <Certificates />
        <Experience />
        <Education />
        <Skills />
        <Novel />
        <Contact />
      </main>
    </ZoomProvider>
  )
}
