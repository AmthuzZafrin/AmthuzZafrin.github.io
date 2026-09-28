import { useEffect, useRef } from 'react'
// Named, and handed to the builder as a bag of exactly what it uses, so it is
// at least legible which parts of the library this section needs. It buys
// almost nothing in size — measured against `import * as THREE`, 1.8kB of 143
// — because the renderer drags the whole shader library in behind it whatever
// else is shaken out. Worth knowing before anyone tries it again.
import {
  AmbientLight,
  Clock,
  Curve,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Shape,
  SphereGeometry,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from 'three'
import { buildIcon } from './contactObject.js'

const PARTS = {
  Curve,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Shape,
  SphereGeometry,
  TubeGeometry,
  Vector3,
}

/**
 * One turn every twenty-six seconds. Slow enough that it is never doing
 * anything while you read the addresses beside it, and never still either.
 */
const TURN_SECONDS = 26
/** How far it leans, so you are looking slightly down on it rather than at it. */
const LEAN = -0.16

/**
 * The lights, in the units three has used since r155: a directional light's
 * diffuse contribution is divided by pi by the material, so an intensity of
 * 2.3 is the 0.73 it looks like. They are the rig the offline preview in
 * tools/preview-contact.mjs approximates, which is how the clay was judged
 * before any of this could be seen in a browser.
 */
const LIGHTS = [
  ['key', 0xfff6e8, 2.3, [-2.2, 3.4, 4.2]],
  ['fill', 0x9db4ff, 0.75, [3.2, -1.8, 2.4]],
  ['rim', 0xffd7a8, 0.9, [0.5, 1.2, -3.5]],
]

export default function ContactScene() {
  const holder = useRef(null)

  useEffect(() => {
    const mount = holder.current
    if (!mount) return undefined

    let renderer
    try {
      renderer = new WebGLRenderer({ alpha: true, antialias: true })
    } catch {
      // No WebGL. The addresses are the section; this was the ornament.
      return undefined
    }

    // Twice the screen's own density and no further: the object is smooth clay
    // and a third pixel buys nothing but fill rate.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearAlpha(0)
    mount.appendChild(renderer.domElement)
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'

    const scene = new Scene()
    const camera = new PerspectiveCamera(30, 1, 0.1, 100)
    camera.position.set(0, 0.25, 6.4)
    camera.lookAt(0, 0, 0)

    scene.add(new AmbientLight(0xdce4ff, 1.3))
    for (const [, colour, intensity, at] of LIGHTS) {
      const light = new DirectionalLight(colour, intensity)
      light.position.set(...at)
      scene.add(light)
    }

    const { group, materials } = buildIcon(PARTS)
    group.rotation.x = LEAN
    scene.add(group)

    const size = () => {
      const box = mount.getBoundingClientRect()
      const side = Math.max(1, Math.min(box.width, box.height))
      renderer.setSize(side, side, false)
      camera.aspect = 1
      camera.updateProjectionMatrix()
    }
    size()
    const resizes = new ResizeObserver(size)
    resizes.observe(mount)

    // The clock is the frame's own, not a frame count: a tab that drops frames
    // should turn the object more per frame, not slow it down.
    const clock = new Clock()
    let frame = 0
    let running = false

    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.1)
      group.rotation.y += (dt / TURN_SECONDS) * Math.PI * 2
      group.position.y = Math.sin(clock.elapsedTime * 0.55) * 0.07
      renderer.render(scene, camera)
      frame = requestAnimationFrame(tick)
    }
    const start = () => {
      if (running) return
      running = true
      clock.getDelta()
      frame = requestAnimationFrame(tick)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(frame)
    }

    // Only while it is on screen and the tab is in front. It is one object,
    // but it is still a GPU running sixty times a second for an ornament.
    const watch = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting && !document.hidden ? start() : stop()),
      { threshold: 0.05 }
    )
    watch.observe(mount)
    const onVisibility = () => (document.hidden ? stop() : undefined)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      watch.disconnect()
      resizes.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      group.traverse((node) => node.isMesh && node.geometry.dispose())
      materials.forEach((m) => m.dispose())
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <div className="contact__scene" ref={holder} />
}
